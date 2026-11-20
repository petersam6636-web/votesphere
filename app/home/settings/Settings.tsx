
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  Settings,
  UserRound,
  ShieldCheck,
  Bell,
  Palette,
  Database,
  LogOut,
  LoaderCircle,
  X,
  ChevronRight,
  Code2,
  Sparkles,
  ExternalLink,
  Shield,
  Users,
  BriefcaseBusiness,
  Fingerprint,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";

const settings = [
  {
    title: "Profile",
    description: "Manage your account information and personal details.",
    icon: UserRound,
  },
  {
    title: "Security",
    description: "Review account security and authentication options.",
    icon: ShieldCheck,
  },
  {
    title: "Notifications",
    description: "Manage election updates and notification preferences.",
    icon: Bell,
  },
  {
    title: "Appearance",
    description: "VoteSphere uses its dark emerald interface.",
    icon: Palette,
  },
  {
    title: "Data and privacy",
    description: "Information about your account and election data.",
    icon: Database,
  },
];

export default function SettingsPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    let active = true;

    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (!error && active) {
          setUser(data.user);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void getUser();

    return () => {
      active = false;
    };
  }, []);

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "User";

  const profilePicture =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.user_metadata?.profile_image ||
    null;

  const handleLogout = async () => {
    setLoggingOut(true);
    setLogoutError("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setLogoutError("Unable to sign out. Please try again.");
      setLoggingOut(false);
      return;
    }

    router.replace("/");
    router.refresh();
  };

  return (
    <>
      <main className="relative isolate w-full space-y-7 pb-8 text-white">
        {/* Ambient decoration */}
        <div className="pointer-events-none absolute -right-20 -top-20 -z-10 h-72 w-72 rounded-full bg-emerald-500/[0.045] blur-[100px]" />

        {/* Page heading */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                <Settings size={15} className="text-zinc-300" />
              </div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                Workspace preferences
              </p>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Settings
              <span className="text-zinc-500">.</span>
            </h1>

            <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-500">
              Manage your account, application preferences and information
              about the people behind VoteSphere.
            </p>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-medium text-zinc-400">
              Account settings
            </span>
          </div>
        </header>

        {/* Account information */}
        <section className="relative overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-[#0d1310] p-5 shadow-xl shadow-black/10 sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-20 h-48 w-48 rounded-full bg-white/[0.025] blur-[65px]" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.045] text-lg font-semibold text-zinc-300">
                {loading ? (
                  <LoaderCircle
                    size={20}
                    className="animate-spin text-zinc-400"
                  />
                ) : profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  userName.charAt(0).toUpperCase()
                )}
              </div>

              <div className="min-w-0">
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Logged in account
                </p>

                {loading ? (
                  <div className="space-y-2">
                    <div className="h-3.5 w-32 animate-pulse rounded bg-white/[0.07]" />
                    <div className="h-2.5 w-44 animate-pulse rounded bg-white/[0.05]" />
                  </div>
                ) : (
                  <>
                    <h2 className="truncate text-sm font-semibold text-zinc-100">
                      {userName}
                    </h2>

                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {user?.email || "No email available"}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2">
              <Fingerprint size={14} className="text-zinc-400" />
              <span className="text-[10px] font-medium text-zinc-400">
                Account identity
              </span>
            </div>
          </div>
        </section>

        {/* Application settings */}
        <section className="overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-[#0d1310] shadow-xl shadow-black/10">
          <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-5 sm:px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04]">
              <Settings size={18} className="text-zinc-300" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Application settings
              </h2>

              <p className="mt-1 text-[11px] text-zinc-500">
                Your workspace preferences
              </p>
            </div>
          </div>

          <div className="divide-y divide-white/[0.055] px-4 sm:px-6">
            {settings.map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="group flex items-center gap-3 py-4 transition-colors sm:gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.035] text-zinc-400 transition-colors group-hover:border-white/[0.12] group-hover:bg-white/[0.06] group-hover:text-zinc-200">
                  <Icon size={17} strokeWidth={1.8} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-semibold text-zinc-200">
                    {title}
                  </h3>

                  <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                    {description}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="hidden rounded-full border border-white/[0.06] bg-white/[0.025] px-2.5 py-1 text-[9px] text-zinc-500 sm:inline-flex">
                    Coming next
                  </span>

                  <ChevronRight
                    size={15}
                    className="text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-300"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Sign out action */}
          <div className="border-t border-white/[0.07] p-4 sm:p-5">
            <button
              onClick={() => {
                setLogoutError("");
                setShowLogout(true);
              }}
              className="group flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-red-500/[0.12] bg-red-500/[0.035] p-4 text-left transition-all duration-300 hover:border-red-500/25 hover:bg-red-500/[0.07]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/[0.12] bg-red-500/[0.07] text-red-400">
                <LogOut size={17} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-semibold text-red-400">
                  Sign out of your account
                </h3>

                <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                  End your current VoteSphere session.
                </p>
              </div>

              <ChevronRight
                size={17}
                className="text-red-400/50 transition-transform group-hover:translate-x-1 group-hover:text-red-400"
              />
            </button>
          </div>
        </section>

        {/* About the developer */}
        <section className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-[#0c1511] shadow-[0_20px_70px_rgba(0,0,0,0.2)]">
          {/* Background effects */}
          <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-emerald-400/[0.07] blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-white/[0.025] blur-[90px]" />

          <div className="relative">
            {/* Section heading */}
            <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-5 sm:px-7">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                <Code2 size={19} className="text-zinc-300" />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-white">
                  About the developer
                </h2>

                <p className="mt-1 text-[11px] text-zinc-500">
                  The people and team behind this experience
                </p>
              </div>
            </div>

            {/* Developer profile */}
            <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_0.85fr] lg:items-center">
              <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
                {/* Company logo */}
                <div className="relative mx-auto flex h-28 w-28 shrink-0 items-center justify-center rounded-[1.75rem] border border-white/[0.09] bg-white/[0.035] p-3 shadow-2xl shadow-black/20 sm:mx-0 sm:h-32 sm:w-32">
                  <div className="absolute inset-2 rounded-[1.2rem] border border-white/[0.045]" />

                  <img
                    src="/business-log.png"
                    alt="MKN logo"
                    className="relative h-full w-full object-contain"
                  />

                  <span className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-lg border border-[#0c1511] bg-emerald-500 text-[#06120b] shadow-lg">
                    <Sparkles size={13} />
                  </span>
                </div>

                {/* Developer details */}
                <div className="min-w-0 text-center sm:text-left">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/[0.17] bg-emerald-400/[0.055] px-3 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                      Application developer
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Solomon Arthur
                  </h3>

                  <p className="mt-2 text-sm font-medium text-zinc-300">
                    VisionCraft
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Development and technology
                  </p>
                </div>
              </div>

              {/* Brand information */}
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <BriefcaseBusiness
                    size={16}
                    className="text-zinc-400"
                  />
                  <h4 className="text-xs font-semibold text-zinc-200">
                    Development identity
                  </h4>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                    <span className="text-[11px] text-zinc-500">
                      Developer
                    </span>
                    <span className="text-xs font-medium text-zinc-200">
                      Solomon Arthur
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                    <span className="text-[11px] text-zinc-500">
                      Working name
                    </span>
                    <span className="text-xs font-medium text-zinc-200">
                      VisionCraft
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] text-zinc-500">
                      Group
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-zinc-200">
                      <Users size={12} className="text-zinc-400" />
                      MKN
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Developer message */}
            <div className="mx-5 mb-5 rounded-2xl border border-emerald-400/[0.12] bg-emerald-400/[0.035] p-4 sm:mx-7 sm:mb-7 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/[0.12] bg-emerald-400/[0.07]">
                  <Sparkles size={16} className="text-emerald-300" />
                </div>

                <div>
                  <p className="text-xs font-semibold text-zinc-200">
                    Built with purpose.
                  </p>

                  <p className="mt-1 text-xs leading-6 text-zinc-500">
                    VoteSphere is presented as a modern digital election
                    experience, developed under VisionCraft and associated
                    with MKN.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer branding */}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-white/[0.07] px-5 py-4 sm:flex-row sm:px-7">
              <div className="flex items-center gap-2">
                <Shield size={13} className="text-zinc-500" />
                <span className="text-[10px] text-zinc-500">
                  VoteSphere application
                </span>
              </div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                VisionCraft <span className="text-zinc-700">×</span> MKN
              </p>
            </div>
          </div>
        </section>

        {/* Page footer */}
        <footer className="pb-2 pt-1 text-center">
          <p className="text-[10px] tracking-wide text-zinc-600">
            VoteSphere · Workspace settings
          </p>
        </footer>
      </main>

      {/* Sign-out confirmation */}
      {showLogout && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onClick={() => !loggingOut && setShowLogout(false)}
        >
          <div
            className="relative w-full max-w-[390px] overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-[#0d1310] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.65)] sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-red-500/[0.06] blur-[75px]" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Account session
                </span>

                <button
                  onClick={() => setShowLogout(false)}
                  disabled={loggingOut}
                  className="cursor-pointer rounded-xl border border-white/[0.07] bg-white/[0.035] p-2 text-zinc-500 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/[0.16] bg-red-500/[0.08] text-red-400 shadow-lg shadow-red-950/20">
                <LogOut size={26} />
              </div>

              <div className="mt-5 text-center">
                <h2 className="text-xl font-bold text-white">
                  Leave your workspace?
                </h2>

                <p className="mx-auto mt-2 max-w-[280px] text-xs leading-6 text-zinc-500">
                  Are you sure you want to sign out of your VoteSphere
                  account? You will need to log in again to access your
                  workspace.
                </p>
              </div>

              {logoutError && (
                <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-3 py-3 text-center text-xs text-red-400">
                  {logoutError}
                </p>
              )}

              <div className="mt-7 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowLogout(false)}
                  disabled={loggingOut}
                  className="flex cursor-pointer items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.08] disabled:opacity-50"
                >
                  Stay here
                </button>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-xs font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loggingOut ? (
                    <>
                      <LoaderCircle size={15} className="animate-spin" />
                      Signing out
                    </>
                  ) : (
                    <>
                      <LogOut size={15} />
                      Sign out
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
