"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const hasStarted = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    void Promise.resolve()
      .then(async () => {
        const callbackUrl = new URL(window.location.href);
        const errorDescription = callbackUrl.searchParams.get("error_description");
        const errorCode = callbackUrl.searchParams.get("error_code");
        const code = callbackUrl.searchParams.get("code");

        if (errorDescription || errorCode) {
          setError(
            errorDescription ??
              `Authentication failed (${errorCode}). Please try again.`
          );
          return;
        }

        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (sessionData.session) {
          router.replace("/home");
          router.refresh();
          return;
        }

        if (!code) {
          setError(
            "The sign-in link is missing its authorization code. Please try again."
          );
          return;
        }

        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }

        router.replace("/home");
        router.refresh();
      })
      .catch((exchangeError: unknown) => {
        setError(
          exchangeError instanceof Error
            ? exchangeError.message
            : "Unable to complete sign-in. Please try again."
        );
      });
  }, [router]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#070b09] px-4 text-zinc-100">
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0d1310] p-6 text-center">
        {error ? (
          <>
            <h1 className="text-lg font-semibold">Sign-in couldn&apos;t be completed</h1>
            <p className="mt-2 text-sm text-zinc-400">{error}</p>
            <Link
              href="/"
              className="mt-5 inline-flex rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#062116] transition hover:bg-emerald-400"
            >
              Return to login
            </Link>
          </>
        ) : (
          <>
            <LoaderCircle
              aria-hidden="true"
              className="mx-auto h-7 w-7 animate-spin text-emerald-400"
            />
            <h1 className="mt-4 text-lg font-semibold">Completing sign-in</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Please wait while we securely verify your account.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
