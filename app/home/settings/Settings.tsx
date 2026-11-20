
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

  // Get logged-in user
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (!error && data.user) {
        setUser(data.user);
      }

      setLoading(false);
    };

    getUser();
  }, []);

  // User information
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

  // Logout
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
      <div className="space-y-6">
        <header>
          <p className="mb-2 text-xs font-medium tracking-wider text-emerald-400">
            PREFERENCES
          </p>

          <h1 className="text-2xl font-bold">
            Settings<span className="text-emerald-400">.</span>
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Manage your VoteSphere account and preferences.
          </p>
        </header>

        {/* Logged-in User Information */}
        <section className="rounded-2xl border border-white/[0.07] bg-[#0d1310] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-400/10 text-lg font-semibold text-emerald-400">
              {loading ? (
                <LoaderCircle size={20} className="animate-spin" />
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
              <p className="mb-1 text-[10px] font-medium tracking-wider text-emerald-400">
                LOGGED IN ACCOUNT
              </p>

              {loading ? (
                <div className="space-y-2">
                  <div className="h-3 w-28 animate-pulse rounded bg-white/[0.07]" />
                  <div className="h-2.5 w-40 animate-pulse rounded bg-white/[0.05]" />
                </div>
              ) : (
                <>
                  <h2 className="truncate text-sm font-semibold text-zinc-200">
                    {userName}
                  </h2>

                  <p className="mt-1 truncate text-xs text-zinc-500">
                    {user?.email || "No email available"}
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Original Application Settings */}
        <section className="rounded-2xl border border-white/[0.07] bg-[#0d1310] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
              <Settings size={21} />
            </div>

            <div>
              <h2 className="text-sm font-semibold">
                Application settings
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Your workspace preferences
              </p>
            </div>
          </div>

          <div className="mt-5 divide-y divide-white/[0.06]">
            {settings.map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="flex items-center gap-3 py-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-400">
                  <Icon size={17} />
                </div>

                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-zinc-200">
                    {title}
                  </h3>

                  <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                    {description}
                  </p>
                </div>

                <span className="ml-auto shrink-0 text-[10px] text-zinc-600">
                  Coming next
                </span>
              </div>
            ))}
          </div>

          {/* Logout */}
          <div className="mt-3 border-t border-white/[0.06] pt-5">
            <button
              onClick={() => {
                setLogoutError("");
                setShowLogout(true);
              }}
              className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-red-500/10 bg-red-500/[0.04] p-3.5 text-left transition-all duration-200 hover:border-red-500/25 hover:bg-red-500/[0.08]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                <LogOut size={17} />
              </div>

              <div>
                <h3 className="text-xs font-semibold text-red-400">
                  Sign out
                </h3>

                <p className="mt-1 text-[11px] text-zinc-500">
                  Sign out of your VoteSphere account.
                </p>
              </div>

              <LogOut
                size={16}
                className="ml-auto text-red-400/50 transition-transform group-hover:translate-x-1 group-hover:text-red-400"
              />
            </button>
          </div>
        </section>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogout && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
          onClick={() => !loggingOut && setShowLogout(false)}
        >
          <div
            className="w-full max-w-[380px] rounded-2xl border border-white/[0.09] bg-[#0d1310] p-6 shadow-2xl shadow-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowLogout(false)}
                disabled={loggingOut}
                className="cursor-pointer rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/15 bg-red-500/10 text-red-400">
              <LogOut size={25} />
            </div>

            {/* Message */}
            <div className="mt-5 text-center">
              <h2 className="text-lg font-bold text-zinc-100">
                Sign out?
              </h2>

              <p className="mx-auto mt-2 max-w-[270px] text-xs leading-6 text-zinc-500">
                Are you sure you want to sign out of your VoteSphere account?
                You will need to log in again to access your workspace.
              </p>
            </div>

            {/* Error */}
            {logoutError && (
              <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-center text-xs text-red-400">
                {logoutError}
              </p>
            )}

            {/* Actions */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowLogout(false)}
                disabled={loggingOut}
                className="flex cursor-pointer items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-xs font-semibold text-zinc-300 transition-all hover:bg-white/[0.08] disabled:opacity-50"
              >
                No, stay
              </button>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-xs font-semibold text-white transition-all hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loggingOut ? (
                  <>
                    <LoaderCircle size={15} className="animate-spin" />
                    Signing out
                  </>
                ) : (
                  <>
                    <LogOut size={15} />
                    Yes, sign out
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
