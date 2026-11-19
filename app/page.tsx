
"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Geist } from "next/font/google";
import gsap from "gsap";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  Mail,
  LockKeyhole,
  ShieldCheck,
  Vote,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Fingerprint,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

type AuthMode = "login" | "signup";
type LoadingType = "email" | "google" | null;

export default function RegisterPage() {
  const router = useRouter();

  const pageRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const hasMounted = useRef(false);

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState<LoadingType>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isLogin = mode === "login";
  const isLoading = loading !== null;

  // Initial animations
  useEffect(() => {
    if (!pageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        pageRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
        }
      );

      gsap.to(".floating-orb", {
        y: -12,
        duration: 3,
        stagger: 0.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  // Form transition
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    if (!formRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        formRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: "power2.out",
        }
      );
    }, formRef);

    return () => ctx.revert();
  }, [mode]);

  const switchMode = (newMode: AuthMode) => {
    if (isLoading || mode === newMode) return;

    setError("");
    setSuccess("");
    setPassword("");
    setShowPassword(false);
    setMode(newMode);
  };

  // EMAIL LOGIN AND REGISTRATION
  const handleEmailAuth = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (isLoading) return;

    setError("");
    setSuccess("");
    setLoading("email");

    try {
      const cleanEmail = email.trim().toLowerCase();

      if (isLogin) {
        // LOGIN
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

        if (error) throw error;
        if (!data.session) {
          throw new Error("Unable to establish your session.");
        }

        router.replace("/home");
        return;
      }

      // SIGN UP
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/home`,
        },
      });

      if (error) throw error;

      if (data.session) {
        router.replace("/home");
        return;
      }

      setSuccess(
        "Account created! Please check your email to confirm your account before signing in."
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(null);
    }
  };

  // GOOGLE AUTHENTICATION
  const handleGoogleAuth = async () => {
    if (isLoading) return;

    setError("");
    setSuccess("");
    setLoading("google");

    try {
      const callbackUrl = new URL(
        "/auth/callback",
        window.location.origin
      );

      callbackUrl.searchParams.set("next", "/home");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) throw error;

      // Supabase now redirects the browser to Google.
      // Do not reset loading here.
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to Google. Please try again."
      );

      setLoading(null);
    }
  };

  return (
    <main
      ref={pageRef}
      className={`${geist.className} relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#050a07] px-3 py-5 text-white selection:bg-emerald-500/30 sm:px-5`}
    >
      {/* BACKGROUND */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[380px] w-[380px] rounded-full bg-emerald-600/[0.12] blur-[100px]" />
        <div className="absolute -bottom-40 -right-32 h-[420px] w-[420px] rounded-full bg-emerald-500/[0.10] blur-[110px]" />

        <div className="floating-orb absolute left-[12%] top-[15%] h-16 w-16 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07]" />
        <div className="floating-orb absolute right-[12%] top-[12%] h-24 w-24 rounded-full border border-emerald-300/15 bg-emerald-300/[0.04]" />
        <div className="floating-orb absolute bottom-[13%] left-[20%] h-10 w-10 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06]" />
        <div className="floating-orb absolute bottom-[20%] right-[18%] h-14 w-14 rounded-full border border-emerald-300/15 bg-emerald-300/[0.05]" />

        <div className="absolute inset-0 opacity-[0.025] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* AUTH CARD */}

      <div
        className="relative z-10 flex min-h-[500px] w-full max-w-[920px] overflow-hidden rounded-[22px] border border-emerald-400/[0.13] bg-[#0a110d]/95 shadow-[0_25px_100px_rgba(0,0,0,0.65)] backdrop-blur-xl lg:h-[570px]"
      >
        <div className="grid w-full grid-cols-1 lg:grid-cols-[0.92fr_1.08fr]">

          {/* LEFT SIDE */}

          <section className="relative flex flex-col justify-center overflow-hidden px-5 py-8 sm:px-9 lg:px-10 xl:px-12">
            <div className="pointer-events-none absolute -right-16 top-10 h-40 w-40 rounded-full bg-emerald-500/[0.045] blur-3xl" />

            <div ref={formRef} className="relative">

              {/* HEADING */}

              <div className="mb-5">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-2.5 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[9px] font-semibold tracking-[1.3px] text-emerald-300">
                    {isLogin ? "WELCOME BACK" : "JOIN VOTESPHERE"}
                  </span>
                </div>

                <h2 className="text-[27px] font-bold tracking-[-1px] sm:text-[30px]">
                  {isLogin ? (
                    <>
                      Welcome <span className="text-emerald-400">back.</span>
                    </>
                  ) : (
                    <>
                      Create your <span className="text-emerald-400">account.</span>
                    </>
                  )}
                </h2>

                <p className="mt-1.5 max-w-[300px] text-[12px] leading-[19px] text-zinc-500">
                  {isLogin
                    ? "Sign in to manage your elections and make every vote count."
                    : "Join VoteSphere and start organizing meaningful elections."}
                </p>
              </div>

              {/* MODE SWITCH */}

              <div className="mb-4 grid grid-cols-2 rounded-xl border border-white/[0.06] bg-[#060b08] p-1">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  disabled={isLoading}
                  className={`cursor-pointer rounded-lg py-2 text-[12px] font-semibold transition ${
                    isLogin
                      ? "border border-emerald-400/15 bg-[#14271d] text-emerald-300"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  disabled={isLoading}
                  className={`cursor-pointer rounded-lg py-2 text-[12px] font-semibold transition ${
                    !isLogin
                      ? "border border-emerald-400/15 bg-[#14271d] text-emerald-300"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* ERROR */}

              {error && (
                <div role="alert" className="mb-3 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-[11px] text-red-400">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {/* SUCCESS */}

              {success && (
                <div role="status" className="mb-3 flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-2 text-[11px] leading-4 text-emerald-300">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                  <p>{success}</p>
                </div>
              )}

              {/* EMAIL FORM */}

              <form onSubmit={handleEmailAuth} className="space-y-3">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-[11px] font-semibold text-zinc-300">
                    Email address
                  </label>

                  <div className="group flex h-[43px] items-center gap-2.5 rounded-lg border border-white/[0.08] bg-[#060b08]/80 px-3 focus-within:border-emerald-400/50">
                    <Mail size={16} className="shrink-0 text-zinc-600 group-focus-within:text-emerald-400" />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="h-full w-full bg-transparent text-[12px] text-white outline-none placeholder:text-zinc-600 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-[11px] font-semibold text-zinc-300">
                    Password
                  </label>

                  <div className="group flex h-[43px] items-center gap-2.5 rounded-lg border border-white/[0.08] bg-[#060b08]/80 px-3 focus-within:border-emerald-400/50">
                    <LockKeyhole size={16} className="shrink-0 text-zinc-600 group-focus-within:text-emerald-400" />

                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      placeholder="Enter your password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-full w-full bg-transparent text-[12px] text-white outline-none placeholder:text-zinc-600 disabled:opacity-50"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="shrink-0 cursor-pointer text-zinc-600 hover:text-emerald-400"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {!isLogin && (
                    <p className="mt-1 text-[10px] text-zinc-600">
                      Use at least 6 characters.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group mt-1 flex h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-400 text-[12px] font-bold text-[#032116] transition hover:from-emerald-400 hover:to-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading === "email" ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" />
                      {isLogin ? "Signing in..." : "Creating account..."}
                    </>
                  ) : (
                    <>
                      {isLogin ? "Sign in to your account" : "Create account"}
                      <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              {/* DIVIDER */}

              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.07]" />
                <span className="text-[9px] font-medium uppercase tracking-[1.5px] text-zinc-600">
                  Or continue with
                </span>
                <div className="h-px flex-1 bg-white/[0.07]" />
              </div>

              {/* GOOGLE */}

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="flex h-[43px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg border border-white/[0.09] bg-white/[0.025] text-[12px] font-semibold text-zinc-300 transition hover:border-emerald-400/30 hover:bg-emerald-500/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading === "google" ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin text-emerald-400" />
                    Connecting to Google...
                  </>
                ) : (
                  <>
                    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
                      <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z" />
                      <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.5H5.8v5.3A20.4 20.4 0 0 0 24 44Z" />
                      <path fill="#FBBC05" d="M12.6 27.5a12.3 12.3 0 0 1 0-7v-5.3H5.8a20.4 20.4 0 0 0 0 17.6l6.8-5.3Z" />
                      <path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6 29.5 4 24 4A20.4 20.4 0 0 0 5.8 15.2l6.8 5.3C14.2 15.6 18.7 12 24 12Z" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              {/* SWITCH */}

              <p className="mt-4 text-center text-[11px] text-zinc-600">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => switchMode(isLogin ? "signup" : "login")}
                  className="ml-1 cursor-pointer font-semibold text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                >
                  {isLogin ? "Create one" : "Sign in"}
                </button>
              </p>
            </div>

            {/* FOOTER */}

            <div className="relative mt-5 flex items-center justify-center gap-1.5 border-t border-white/[0.06] pt-3">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span className="text-[9px] text-zinc-600">
                Your information is securely protected.
              </span>
            </div>
          </section>

          {/* RIGHT SIDE */}

          <section className="relative m-2.5 hidden overflow-hidden rounded-[17px] border border-emerald-300/[0.13] bg-[#06150d] lg:block">
            <div className="absolute inset-0 bg-gradient-to-b from-[#03150d]/30 via-transparent to-[#03150d]/95" />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-transparent to-emerald-900/20" />

            <div className="floating-orb absolute -right-10 top-20 h-40 w-40 rounded-full border border-emerald-300/20 bg-emerald-400/[0.07]" />
            <div className="floating-orb absolute right-24 top-44 h-12 w-12 rounded-full border border-emerald-200/30 bg-emerald-300/10" />
            <div className="floating-orb absolute bottom-36 left-8 h-20 w-20 rounded-full border border-emerald-300/20 bg-emerald-400/[0.08]" />
            <div className="floating-orb absolute bottom-24 right-12 h-8 w-8 rounded-full border border-emerald-300/30 bg-emerald-300/10" />

            <div className="relative flex h-full flex-col justify-between p-7 xl:p-9">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-2">
                  <Sparkles size={13} className="text-emerald-300" />
                  <span className="text-[9px] font-semibold uppercase tracking-[1.8px] text-white/80">
                    The future of voting
                  </span>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-300">
                  <Fingerprint size={19} />
                </div>
              </div>

              <div className="relative z-10 max-w-[330px]">
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-px w-7 bg-emerald-400" />
                  <span className="text-[9px] font-bold uppercase tracking-[2.5px] text-emerald-300">
                    Your voice. Your choice.
                  </span>
                </div>

                <h2 className="text-[38px] font-bold leading-[1.08] tracking-[-1.5px] text-white xl:text-[43px]">
                  Every vote
                  <br />
                  shapes the
                  <br />
                  <span className="text-emerald-400">future.</span>
                </h2>

                <p className="mt-4 max-w-[290px] text-[12px] leading-[21px] text-white/65">
                  Create elections, bring people together, and choose the
                  leaders who will make a difference.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
                    <Vote size={12} className="text-emerald-300" />
                    <span className="text-[9px] font-medium text-white/75">Fair voting</span>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
                    <ShieldCheck size={12} className="text-emerald-300" />
                    <span className="text-[9px] font-medium text-white/75">Secure elections</span>
                  </div>
                </div>
              </div>

              <div className="relative flex items-center justify-between border-t border-white/15 pt-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-[9px] font-semibold tracking-[1.5px] text-white/60">
                    VOTESPHERE
                  </span>
                </div>

                <span className="text-[9px] text-white/40">
                  Democracy starts with you.
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
