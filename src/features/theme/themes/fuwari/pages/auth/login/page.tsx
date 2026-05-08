import { Link } from "@tanstack/react-router";
import { Github, Loader2 } from "lucide-react";
import type { LoginPageProps } from "@/features/theme/contract/pages";
import { m } from "@/paraglide/messages";

function GoogleIcon({ size = 16 }: { size?: number }) {
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

export function LoginPage({
  isEmailConfigured,
  loginForm,
  socialLogin,
  turnstileElement,
}: LoginPageProps) {
  const {
    register,
    errors,
    handleSubmit,
    loginStep,
    isSubmitting,
    turnstilePending: formTurnstilePending,
  } = loginForm;

  const {
    isLoading: socialIsLoading,
    handleGithubLogin,
    handleGoogleLogin,
    isGoogleLoading,
  } = socialLogin;

  const isFormDisabled =
    isSubmitting || loginStep !== "IDLE" || formTurnstilePending;
  const isSocialDisabled = socialIsLoading || !!isGoogleLoading;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold fuwari-text-90">
          {isEmailConfigured ? m.login_title() : m.login_auth_title()}
        </h1>
        <p className="text-sm font-medium fuwari-text-50">
          {isEmailConfigured
            ? m.login_welcome_back()
            : m.login_only_third_party_fuwari()}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Email Login Form */}
        {isEmailConfigured && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5 focus-within:text-(--fuwari-primary) transition-colors text-(--fuwari-text-50)">
              <label htmlFor="login-email" className="text-sm font-bold ml-1">
                {m.login_email_address()}
              </label>
              <input
                id="login-email"
                type="email"
                {...register("email")}
                placeholder={m.login_email_placeholder()}
                autoComplete="username"
                disabled={isFormDisabled}
                className="w-full bg-(--fuwari-input-bg) border border-(--fuwari-input-border) rounded-xl px-4 py-3 text-(--fuwari-text-90) placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:border-(--fuwari-primary)/50 focus:bg-(--fuwari-primary)/5 transition-all text-sm outline-none"
              />
              {errors.email && (
                <span className="text-xs text-red-500 ml-1 mt-1 font-medium">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5 focus-within:text-(--fuwari-primary) transition-colors text-(--fuwari-text-50)">
              <div className="flex justify-between items-center ml-1">
                <label htmlFor="login-password" className="text-sm font-bold">
                  {m.login_password()}
                </label>
                <Link
                  to="/forgot-password"
                  tabIndex={-1}
                  className="text-xs font-medium hover:text-(--fuwari-primary) transition-colors"
                >
                  {m.login_forgot_password_fuwari()}
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                {...register("password")}
                placeholder={m.login_password_placeholder()}
                autoComplete="current-password"
                disabled={isFormDisabled}
                className="w-full bg-(--fuwari-input-bg) border border-(--fuwari-input-border) rounded-xl px-4 py-3 text-(--fuwari-text-90) placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:border-(--fuwari-primary)/50 focus:bg-(--fuwari-primary)/5 transition-all text-sm outline-none"
              />
              {errors.password && (
                <span className="text-xs text-red-500 ml-1 mt-1 font-medium">
                  {errors.password.message}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isFormDisabled}
              className="mt-2 w-full py-3.5 rounded-xl fuwari-btn-primary font-bold text-sm tracking-wide active:scale-[0.98] transition-all gap-2"
            >
              {loginStep === "VERIFYING" ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>{m.login_submitting()}</span>
                </>
              ) : (
                <span>{m.login_submit()}</span>
              )}
            </button>
          </form>
        )}

        {/* Divider */}
        {isEmailConfigured && (
          <div className="relative flex items-center py-2">
            <div className="flex-1 border-t border-border/30"></div>
            <span className="mx-4 text-xs font-medium fuwari-text-30">
              {m.login_or()}
            </span>
            <div className="flex-1 border-t border-border/30"></div>
          </div>
        )}

        {/* Social Login */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleGithubLogin}
            disabled={isSocialDisabled}
            className={`group w-full py-3.5 rounded-xl flex gap-3 transition-all font-bold text-sm active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 ${
              !isEmailConfigured && !handleGoogleLogin
                ? "fuwari-btn-primary"
                : "fuwari-btn-regular"
            }`}
          >
            {socialIsLoading ? (
              <Loader2 size={16} className="animate-spin opacity-70" />
            ) : (
              <Github size={16} />
            )}

            <span className="tracking-wide">
              {socialIsLoading
                ? m.login_social_connecting()
                : m.login_github_fuwari()}
            </span>
          </button>

          {handleGoogleLogin && (
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSocialDisabled}
              className="group w-full py-3.5 rounded-xl flex gap-3 transition-all font-bold text-sm active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 fuwari-btn-regular"
            >
              {isGoogleLoading ? (
                <Loader2 size={16} className="animate-spin opacity-70" />
              ) : (
                <GoogleIcon size={16} />
              )}

              <span className="tracking-wide">
                {isGoogleLoading
                  ? m.login_social_connecting()
                  : m.login_google_fuwari()}
              </span>
            </button>
          )}
        </div>

        {turnstileElement}

        {/* Footer Link */}
        {isEmailConfigured && (
          <div className="text-center pt-2">
            <p className="text-sm font-medium fuwari-text-50">
              {m.login_no_account()}{" "}
              <Link
                to="/register"
                className="text-(--fuwari-primary) hover:underline"
              >
                {m.login_register_now()}
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
