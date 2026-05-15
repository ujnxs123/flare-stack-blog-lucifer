import { OAuthProvider } from "@cloudflare/workers-oauth-provider";
import { McpApiHandler } from "@/features/mcp/api/mcp-api-handler";
import { createWorkersOAuthProviderOptions } from "@/features/oauth-provider/oauth-provider.config";
import {
  OAUTH_BLOG_SCOPES,
} from "@/features/oauth-provider/oauth-provider.shared";
import { appWorkerHandler } from "./app-handler";

let oauthProvider: OAuthProvider<Env> | null = null;

function getOAuthProvider() {
  if (oauthProvider) {
    return oauthProvider;
  }

  oauthProvider = new OAuthProvider(
    createWorkersOAuthProviderOptions({
      apiHandlers: {
        "/mcp": McpApiHandler,
      },
      defaultHandler: appWorkerHandler,
    }),
  );

  return oauthProvider;
}

function handleMcpProtectedResourceMetadata(requestUrl: URL, request: Request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Content-Length": "0",
        "Access-Control-Allow-Origin": request.headers.get("Origin") ?? "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "Authorization, *",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const origin = requestUrl.origin;
  const metadata = {
    resource: `${origin}/mcp`,
    authorization_servers: [origin],
    scopes_supported: OAUTH_BLOG_SCOPES,
    bearer_methods_supported: ["header"],
  };
  const response = new Response(JSON.stringify(metadata), {
    headers: { "Content-Type": "application/json" },
  });

  const reqOrigin = request.headers.get("Origin");
  if (reqOrigin) {
    response.headers.set("Access-Control-Allow-Origin", reqOrigin);
  }
  return response;
}

export function handleRootRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
) {
  const url = new URL(request.url);

  if (
    url.pathname === "/.well-known/oauth-protected-resource" ||
    url.pathname === "/.well-known/oauth-protected-resource/mcp"
  ) {
    return handleMcpProtectedResourceMetadata(url, request);
  }

  return getOAuthProvider().fetch(request, env, ctx);
}
