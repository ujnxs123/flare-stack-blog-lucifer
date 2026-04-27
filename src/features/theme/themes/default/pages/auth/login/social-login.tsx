import { Github, Loader2 } from "lucide-react";
import type { SocialLoginData } from "@/features/theme/contract/pages";
import { m } from "@/paraglide/messages";

interface SocialLoginProps extends SocialLoginData {
  showDivider?: boolean;
}

export function SocialLogin({
  isLoading,
  activeProvider,
  handleGithubLogin,
  handleGoogleLogin,
  showDivider = true,
}: SocialLoginProps) {
  const isGithubLoading = isLoading && activeProvider === "github";
  const isGoogleLoading = isLoading && activeProvider === "google";

  return (
    <div className="space-y-6">
      {showDivider && (
        <div className="relative flex items-center">
          <div className="grow h-px bg-border/30"></div>
          <span className="shrink-0 mx-4 text-[9px] font-mono uppercase tracking-widest text-muted-foreground/40">
            {m.login_or()}
          </span>
          <div className="grow h-px bg-border/30"></div>
        </div>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleGithubLogin}
          disabled={isLoading}
          className={`group w-full py-4 border border-border/40 flex items-center justify-center gap-3 transition-all hover:border-foreground disabled:opacity-50 disabled:cursor-not-allowed ${
            !showDivider
              ? "bg-foreground text-background border-transparent hover:opacity-80"
              : ""
          }`}
        >
          {isGithubLoading ? (
            <Loader2
              size={14}
              className={`${showDivider ? "text-muted-foreground" : "text-background"} animate-spin`}
            />
          ) : (
            <Github size={14} strokeWidth={1.5} />
          )}

          <span className="text-[10px] font-mono uppercase tracking-widest">
            {isGithubLoading ? m.login_social_connecting() : m.login_github()}
          </span>
        </button>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="group w-full py-4 border border-border/40 flex items-center justify-center gap-3 transition-all hover:border-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGoogleLoading ? (
            <Loader2 size={14} className="text-muted-foreground animate-spin" />
          ) : (
            <span className="text-[10px] font-mono">G</span>
          )}

          <span className="text-[10px] font-mono uppercase tracking-widest">
            {isGoogleLoading ? m.login_social_connecting() : "Google"}
          </span>
        </button>
      </div>

      {!showDivider && (
        <p className="text-[9px] font-mono text-muted-foreground/30 text-center">
          {m.login_powered_by_github()}
        </p>
      )}
    </div>
  );
}
