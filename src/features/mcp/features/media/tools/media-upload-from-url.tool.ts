import * as MediaService from "@/features/media/service/media.service";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_SIZE,
} from "@/features/media/media.schema";
import type { OAuthScopeRequest } from "@/features/oauth-provider/schema/oauth-provider.schema";
import { defineMcpTool } from "../../../service/mcp-tool";
import {
  McpMediaUploadFromUrlInputSchema,
  McpMediaUploadFromUrlOutputSchema,
} from "../schema/mcp-media.schema";

const MEDIA_UPLOAD_FROM_URL_REQUIRED_SCOPES: OAuthScopeRequest = {
  media: ["write"],
};

/**
 * Derive a file name from a URL path.
 * Falls back to a UUID-based name if the URL has no usable path segment.
 */
function deriveFileName(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const lastSegment = pathname.split("/").filter(Boolean).pop();
    if (lastSegment && /\.\w{2,5}$/.test(lastSegment)) {
      return lastSegment;
    }
  } catch {
    // ignore parse errors
  }
  return `${crypto.randomUUID()}.png`;
}

/**
/**
 * Decompress a pako-encoded mermaid.ink URL and return the fixed URL.
 * mermaid.ink no longer supports the pako: compressed format that some
 * MCP clients generate. This function decompresses the payload and
 * re-encodes it as plain base64 which mermaid.ink accepts.
 * Returns null if the URL is not a pako mermaid URL or decompression fails.
 */
async function decompressMermaidPakoUrl(url: string): Promise<string | null> {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "mermaid.ink") return null;

    const pathname = parsed.pathname;
    const pakoMatch = pathname.match(/^\/(img|svg)\/pako:(.+)$/);
    if (!pakoMatch) return null;

    const [, format, pakoData] = pakoMatch;

    // Convert base64url to standard base64
    let base64 = pakoData.replace(/-/g, "+").replace(/_/g, "/");
    // Add padding if needed
    while (base64.length % 4 !== 0) {
      base64 += "=";
    }

    const binaryStr = atob(base64);
    const compressedBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      compressedBytes[i] = binaryStr.charCodeAt(i);
    }

    // Decompress using DecompressionStream with "deflate" format
    // (pako default uses zlib-wrapped deflate)
    const ds = new DecompressionStream("deflate");
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();

    writer.write(compressedBytes);
    writer.close();

    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    // Combine chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const decompressed = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      decompressed.set(chunk, offset);
      offset += chunk.length;
    }

    // The decompressed data is the mermaid diagram text
    const mermaidText = new TextDecoder().decode(decompressed);

    // Re-encode as standard base64 for the working mermaid.ink format
    const newBase64 = btoa(mermaidText);

    return `https://mermaid.ink/${format}/${newBase64}`;
  } catch {
    return null;
  }
}

/**
 * Determine MIME type from Content-Type header or file extension.
 */
function resolveMimeType(
  contentType: string | null,
  fileName: string,
): string | undefined {
  // Try Content-Type header first
  if (contentType) {
    const mime = contentType.split(";")[0].trim().toLowerCase();
    if (ACCEPTED_IMAGE_TYPES.includes(mime)) {
      return mime;
    }
  }

  // Fallback to extension
  const ext = fileName.split(".").pop()?.toLowerCase();
  const extMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
  };
  const fromExt = extMap[ext || ""];
  if (fromExt && ACCEPTED_IMAGE_TYPES.includes(fromExt)) {
    return fromExt;
  }

  return undefined;
}

export const mediaUploadFromUrlTool = defineMcpTool({
  name: "media_upload_from_url",
  description:
    "Download an image from a public URL and upload it to the media library. Supported formats: JPEG, PNG, WebP, GIF. Max size: 10 MB.",
  requiredScopes: MEDIA_UPLOAD_FROM_URL_REQUIRED_SCOPES,
  inputSchema: McpMediaUploadFromUrlInputSchema,
  outputSchema: McpMediaUploadFromUrlOutputSchema,
  async handler(args, context) {
    let { url, fileName: userFileName } = args;

    // Auto-fix mermaid.ink pako URLs (deprecated format that returns 400)
    const fixedMermaidUrl = await decompressMermaidPakoUrl(url);
    if (fixedMermaidUrl) {
      url = fixedMermaidUrl;
    }

    // Fetch the image from the remote URL
    // Use browser-like headers to avoid bot detection on some hosts
    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow",
      });
    } catch (e) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to fetch image from URL: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
        isError: true,
      };
    }

    if (!response.ok) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to fetch image: HTTP ${response.status} ${response.statusText}`,
          },
        ],
        isError: true,
      };
    }

    // Determine file name
    const fileName = userFileName || deriveFileName(url);

    // Determine MIME type
    const contentType = response.headers.get("content-type");
    const mimeType = resolveMimeType(contentType, fileName);

    if (!mimeType) {
      return {
        content: [
          {
            type: "text",
            text: `Unsupported or undetectable image type. Content-Type: "${contentType || "unknown"}". Accepted types: ${ACCEPTED_IMAGE_TYPES.join(", ")}`,
          },
        ],
        isError: true,
      };
    }

    // Read the response body
    const arrayBuffer = await response.arrayBuffer();

    // Check file size
    if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
      return {
        content: [
          {
            type: "text",
            text: `File too large (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)} MB). Maximum allowed: 10 MB.`,
          },
        ],
        isError: true,
      };
    }

    // Ensure the file name has the correct extension for the detected MIME
    let finalFileName = fileName;
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const expectedExt = extMap[mimeType];
    if (expectedExt && !finalFileName.toLowerCase().endsWith(`.${expectedExt}`)) {
      // If the file name doesn't have the right extension, append it
      const hasExt = /\.\w{2,5}$/.test(finalFileName);
      if (!hasExt) {
        finalFileName = `${finalFileName}.${expectedExt}`;
      }
    }

    // Create a File object
    const file = new File([arrayBuffer], finalFileName, { type: mimeType });

    const result = await MediaService.upload(context, { file });

    if (result.error) {
      return {
        content: [
          {
            type: "text",
            text: `Upload failed: ${result.error.reason}`,
          },
        ],
        isError: true,
      };
    }

    const media = result.data;
    const output = {
      id: media.id,
      key: media.key,
      url: media.url,
      fileName: media.fileName,
      mimeType: media.mimeType,
      sizeInBytes: media.sizeInBytes,
      width: media.width ?? null,
      height: media.height ?? null,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
      structuredContent: output,
    };
  },
});
