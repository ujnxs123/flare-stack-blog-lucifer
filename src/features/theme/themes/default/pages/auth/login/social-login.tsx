import { Github, Loader2 } from "lucide-react";
import type { SocialLoginData } from "@/features/theme/contract/pages";
import { m } from "@/paraglide/messages";

interface SocialLoginProps extends SocialLoginData {
  showDivider?: boolean;
}

function GoogleIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function SocialLogin({
  isLoading,
  handleGithubLogin,
  handleGoogleLogin,
  isGoogleLoading,
  showDivider = true,
}: SocialLoginProps) {
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
          disabled={isLoading || isGoogleLoading}
          className={`group w-full py-4 border border-border/40 flex items-center justify-center gap-3 transition-all hover:border-foreground disabled:opacity-50 disabled:cursor-not-allowed ${
            !showDivider && !handleGoogleLogin
              ? "bg-foreground text-background border-transparent hover:opacity-80"
              : ""
          }`}
        >
          {isLoading ? (
            <Loader2
              size={14}
              className={`${showDivider || handleGoogleLogin ? "text-muted-foreground" : "text-background"} animate-spin`}
            />
          ) : (
            <Github size={14} strokeWidth={1.5} />
          )}

          <span className="text-[10px] font-mono uppercase tracking-widest">
            {isLoading ? m.login_social_connecting() : m.login_github()}
          </span>
        </button>

        {handleGoogleLogin && (
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
            className="group w-full py-4 border border-border/40 flex items-center justify-center gap-3 transition-all hover:border-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <Loader2
                size={14}
                className="text-muted-foreground animate-spin"
              />
            ) : (
              <GoogleIcon size={14} />
            )}

            <span className="text-[10px] font-mono uppercase tracking-widest">
              {isGoogleLoading ? m.login_social_connecting() : m.login_google()}
            </span>
          </button>
        )}
      </div>

      {!showDivider && !handleGoogleLogin && (
        <p className="text-[9px] font-mono text-muted-foreground/30 text-center">
          {m.login_powered_by_github()}
        </p>
      )}
    </div>
  );
}
