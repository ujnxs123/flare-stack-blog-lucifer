import * as MediaService from "@/features/media/service/media.service";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_SIZE,
} from "@/features/media/media.schema";
import { getContentTypeFromKey } from "@/features/media/utils/media.utils";
import type { OAuthScopeRequest } from "@/features/oauth-provider/schema/oauth-provider.schema";
import { defineMcpTool } from "../../../service/mcp-tool";
import {
  McpMediaUploadInputSchema,
  McpMediaUploadOutputSchema,
} from "../schema/mcp-media.schema";

const MEDIA_UPLOAD_REQUIRED_SCOPES: OAuthScopeRequest = {
  media: ["write"],
};

export const mediaUploadTool = defineMcpTool({
  name: "media_upload",
  description:
    "Upload an image to the media library. Accepts base64-encoded image data. Supported formats: JPEG, PNG, WebP, GIF. Max size: 10 MB.",
  requiredScopes: MEDIA_UPLOAD_REQUIRED_SCOPES,
  inputSchema: McpMediaUploadInputSchema,
  outputSchema: McpMediaUploadOutputSchema,
  async handler(args, context) {
    const { base64Data, fileName } = args;

    // Determine MIME type from file name
    const mimeType = getContentTypeFromKey(fileName);
    if (!mimeType || !ACCEPTED_IMAGE_TYPES.includes(mimeType)) {
      return {
        content: [
          {
            type: "text",
            text: `Unsupported image type for "${fileName}". Accepted types: ${ACCEPTED_IMAGE_TYPES.join(", ")}`,
          },
        ],
        isError: true,
      };
    }

    // Decode base64 to binary
    let buffer: ArrayBuffer;
    try {
      const raw = atob(base64Data);
      const arr = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) {
        arr[i] = raw.charCodeAt(i);
      }
      buffer = arr.buffer as ArrayBuffer;
    } catch {
      return {
        content: [
          { type: "text", text: "Invalid base64 data. Could not decode." },
        ],
        isError: true,
      };
    }

    // Check file size
    if (buffer.byteLength > MAX_FILE_SIZE) {
      return {
        content: [
          {
            type: "text",
            text: `File too large (${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB). Maximum allowed: 10 MB.`,
          },
        ],
        isError: true,
      };
    }

    // Create a File object from the binary data
    const file = new File([buffer], fileName, { type: mimeType });

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
