
"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  Mail,
  Lock,
  Vote,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import gsap from "gsap";

type AuthMode = "login" | "signup";
type LoadingType = "email" | "google" | null;

export default function RegisterPage() {
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState<LoadingType>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Listen for successful authentication, including Google redirects.
  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (
        session &&
        (event === "SIGNED_IN" || event === "INITIAL_SESSION")
      ) {
        router.replace("/home");
        router.refresh();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  // Entrance animation.
  useEffect(() => {
    if (!containerRef.current || !cardRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        {
          opacity: 0,
          y: 25,
          scale: 0.97,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "power3.out",
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleEmailAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (password.length < 6) {
      setError("Your password must contain at least 6 characters.");
      return;
    }

    setLoading("email");

    try {
      if (mode === "login") {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

        if (error) throw error;

        if (!data.session) {
          throw new Error("Login failed. Please try again.");
        }

        router.replace("/home");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            // Confirmation returns to this same page.
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) throw error;

        if (data.session) {
          router.replace("/home");
          router.refresh();
        } else {
          setSuccess(
            "Account created! Please check your email to confirm your account."
          );
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";

      setError(message);
    } finally {
      setLoading(null);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setSuccess("");
    setLoading("google");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Google returns directly to this page.
          redirectTo: window.location.origin,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Google sign-in failed. Please try again.";

      setError(message);
      setLoading(null);
    }
  };

  const changeMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError("");
    setSuccess("");
    setPassword("");
  };

  return (
    <main
      ref={containerRef}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06130f] px-4 py-5 text-white"
    >
      {/* Background decorations */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-green-400/10 blur-[100px]" />

      <div className="pointer-events-none absolute left-[12%] top-[15%] h-3 w-3 animate-pulse rounded-full bg-emerald-400/60" />
      <div className="pointer-events-none absolute right-[15%] top-[25%] h-5 w-5 animate-pulse rounded-full bg-green-300/30" />
      <div className="pointer-events-none absolute bottom-[15%] left-[25%] h-4 w-4 animate-pulse rounded-full bg-emerald-300/30" />

      <div
        ref={cardRef}
        className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1d16] shadow-2xl shadow-black/40 md:grid-cols-2"
      >
        {/* LEFT: Authentication */}
        <section className="flex flex-col justify-center p-6 sm:p-9 lg:p-12">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-[#062016]">
              <Vote size={25} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">
                VoteSphere
              </h1>
              <p className="text-xs text-emerald-400">
                Your voice matters
              </p>
            </div>
          </div>

          <div className="mb-7">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-400">
              <Sparkles size={16} />
              Democracy starts with you.
            </div>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {mode === "login" ? (
                <>
                  Welcome <span className="text-emerald-400">back.</span>
                </>
              ) : (
                <>
                  Create your <span className="text-emerald-400">account.</span>
                </>
              )}
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-400">
              {mode === "login"
                ? "Sign in to continue making your voice heard."
                : "Join VoteSphere and make your voice part of the future."}
            </p>
          </div>

          {/* Login / Signup toggle */}
          <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/10 bg-[#07150f] p-1">
            <button
              type="button"
              onClick={() => changeMode("login")}
              className={`cursor-pointer rounded-lg py-2.5 text-sm font-semibold transition-all ${
                mode === "login"
                  ? "bg-emerald-500 text-[#062016] shadow-lg shadow-emerald-950/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => changeMode("signup")}
              className={`cursor-pointer rounded-lg py-2.5 text-sm font-semibold transition-all ${
                mode === "signup"
                  ? "bg-emerald-500 text-[#062016] shadow-lg shadow-emerald-950/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Register
            </button>
          </div>

          {/* Authentication form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-[#07150f] py-3.5 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Password
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "login"
                      ? "current-password"
                      : "new-password"
                  }
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-[#07150f] py-3.5 pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 transition hover:text-emerald-400"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="flex gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                <CheckCircle2 size={18} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading !== null}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-[#062016] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading === "email" ? (
                <>
                  <LoaderCircle size={19} className="animate-spin" />
                  Please wait...
                </>
              ) : (
                <>
                  {mode === "login" ? "Sign in" : "Create account"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-gray-500">OR CONTINUE WITH</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Google authentication */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading !== null}
            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] py-3.5 text-sm font-semibold text-gray-200 transition hover:border-emerald-500/40 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading === "google" ? (
              <>
                <LoaderCircle size={19} className="animate-spin" />
                Connecting to Google...
              </>
            ) : (
              <>
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 48 48"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.5H5.8v5.3A20.4 20.4 0 0 0 24 44Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M12.6 27.5a12.3 12.3 0 0 1 0-7v-5.3H5.8a20.4 20.4 0 0 0 0 17.6l6.8-5.3Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6 29.5 4 24 4A20.4 20.4 0 0 0 5.8 15.2l6.8 5.3C14.2 15.6 18.7 12 24 12Z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <p className="mt-7 text-center text-xs leading-5 text-gray-500">
            By continuing, you agree to use VoteSphere responsibly and
            respect the voices of others.
          </p>
        </section>

        {/* RIGHT: Promotional panel */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-800 to-[#06251a] p-10 md:flex lg:p-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-emerald-400/10 blur-2xl" />

          <div className="relative z-10 flex items-center gap-2 text-sm font-semibold text-emerald-100">
            <ShieldCheck size={19} />
            A platform built for your voice
          </div>

          <div className="relative z-10 py-10">
            <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/10 backdrop-blur-sm">
              <Vote size={42} />
            </div>

            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-200">
              The future of voting
            </p>

            <h2 className="max-w-md text-4xl font-bold leading-tight lg:text-5xl">
              Your voice.
              <br />
              <span className="text-emerald-200">Your choice.</span>
            </h2>

            <p className="mt-6 max-w-sm text-sm leading-7 text-emerald-100/80">
              Every vote shapes the future. Join a community where
              participation matters and every voice counts.
            </p>

            <div className="mt-9 flex flex-wrap gap-2">
              {["Secure voting", "Your voice matters", "Fair participation"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="relative z-10 border-t border-white/15 pt-6">
            <p className="text-sm font-medium text-white">
              Democracy starts with you.
            </p>
            <p className="mt-1 text-xs text-emerald-200/70">
              VoteSphere — Every vote shapes the future.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
