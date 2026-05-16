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
    const { url, fileName: userFileName } = args;

    // Fetch the image from the remote URL
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { "User-Agent": "BlogMCP-MediaFetcher/1.0" },
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
