
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  Code2,
  Building2,
  Users,
  Sparkles,
  ChevronRight,
  Mail,
  BriefcaseBusiness,
  Info,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";

type User = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    display_name?: string;
    avatar_url?: string;
    picture?: string;
    profile_image?: string;
  };
};

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
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);

  useEffect(() => {
    let active = true;

    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) throw error;

        if (active) {
          setUser(data.user as User | null);
        }
      } catch (err) {
        console.error("Unable to load user:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    getUser();

    return () => {
      active = false;
    };
  }, []);

  // Close modals with the Escape key.
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowDeveloperModal(false);
        setShowLogoutModal(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "User";

  const userEmail = user?.email || "No email available";

  const profileImage =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.user_metadata?.profile_image;

  const handleLogout = async () => {
    setLoggingOut(true);
    setError("");

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setError("Unable to sign out. Please try again.");
        setLoggingOut(false);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Unable to sign out. Please try again.");
      setLoggingOut(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050b08] px-4 py-8 text-white sm:px-6 lg:px-10">
      {/* Background effects */}
      <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-emerald-500/[0.07] blur-[130px]" />
      <div className="pointer-events-none absolute -right-40 top-96 h-96 w-96 rounded-full bg-emerald-400/[0.05] blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-teal-500/[0.04] blur-[120px]" />

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-9">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.09] bg-white/[0.045]">
              <Settings className="h-5 w-5 text-gray-300" />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-400">
                Account workspace
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                Settings
              </h1>
            </div>
          </div>

          <p className="max-w-2xl text-sm leading-6 text-gray-400">
            Manage your account, review your application preferences, and
            learn more about the people behind VoteSphere.
          </p>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.85fr_1.4fr]">
          {/* Account card */}
          <section className="h-fit overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0b1510]/90 shadow-2xl shadow-black/20">
            <div className="border-b border-white/[0.07] px-6 py-5">
              <div className="flex items-center gap-3">
                <UserRound className="h-5 w-5 text-gray-400" />
                <h2 className="font-semibold">Your account</h2>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Your currently authenticated account information.
              </p>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex min-h-36 items-center justify-center">
                  <LoaderCircle className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06]">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-semibold text-gray-300">
                          {userName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-white">
                        {userName}
                      </h3>
                      <p className="mt-1 break-all text-sm text-gray-400">
                        {userEmail}
                      </p>
                      <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Authenticated account
                      </span>
                    </div>
                  </div>

                  <div className="mt-7 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Mail className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">
                        Email address
                      </span>
                    </div>
                    <p className="mt-2 break-all text-sm text-gray-200">
                      {userEmail}
                    </p>
                  </div>

                  <p className="mt-4 text-xs leading-5 text-gray-500">
                    Your account information is displayed here for reference.
                    Profile editing is not currently available.
                  </p>
                </>
              )}
            </div>
          </section>

          {/* Settings and actions */}
          <section className="overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0b1510]/90 shadow-2xl shadow-black/20">
            <div className="border-b border-white/[0.07] px-6 py-5">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-gray-400" />
                <h2 className="font-semibold">Application settings</h2>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Your VoteSphere application preferences and information.
              </p>
            </div>

            <div className="p-3 sm:p-4">
              {/* Existing settings */}
              <div className="space-y-1">
                {settings.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="group flex items-center gap-4 rounded-2xl px-3 py-4 transition-colors hover:bg-white/[0.035] sm:px-4"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] transition-colors group-hover:bg-white/[0.06]">
                        <Icon className="h-[19px] w-[19px] text-gray-400" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-gray-200">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
                          {item.description}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[10px] font-medium text-gray-500">
                        Coming next
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* About the Developer - clickable modal trigger */}
              <div className="my-3 border-t border-white/[0.07]" />

              <button
                type="button"
                onClick={() => setShowDeveloperModal(true)}
                className="group flex w-full items-center gap-4 rounded-2xl px-3 py-4 text-left transition-all duration-200 hover:bg-emerald-400/[0.045] sm:px-4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] transition-colors group-hover:border-emerald-400/20 group-hover:bg-emerald-400/[0.06]">
                  <Info className="h-[19px] w-[19px] text-gray-400 group-hover:text-gray-200" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-gray-200">
                    About the Developer
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
                    Learn about the developer and the team behind VoteSphere.
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="hidden rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2.5 py-1 text-[10px] font-medium text-emerald-300 sm:inline-flex">
                    Learn more
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-500 transition-transform group-hover:translate-x-1 group-hover:text-gray-200" />
                </div>
              </button>

              {/* Sign out */}
              <div className="my-3 border-t border-white/[0.07]" />

              <div className="flex flex-col gap-4 rounded-2xl px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-400/10 bg-red-400/[0.055]">
                    <LogOut className="h-[19px] w-[19px] text-red-400" />
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-200">
                      Sign out of your account
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                      End your current VoteSphere session.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setShowLogoutModal(true);
                  }}
                  className="rounded-xl border border-red-400/20 bg-red-400/[0.07] px-5 py-2.5 text-xs font-semibold text-red-300 transition-all hover:border-red-400/40 hover:bg-red-400/[0.13] sm:ml-auto"
                >
                  Sign out
                </button>
              </div>
            </div>
          </section>
        </div>

        <p className="mt-8 text-center text-xs text-gray-600">
          VoteSphere · Account and application settings
        </p>
      </div>

      {/* ABOUT THE DEVELOPER MODAL */}
      {showDeveloperModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 px-4 py-8 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowDeveloperModal(false);
            }
          }}
        >
          <div className="relative my-auto w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute -inset-1 rounded-[30px] bg-emerald-500/[0.08] blur-2xl" />

            <div className="relative overflow-hidden rounded-[28px] border border-white/[0.11] bg-[#0b1510] shadow-2xl shadow-black/50">
              {/* Modal decoration */}
              <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-400/[0.08] blur-[90px]" />
              <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-teal-400/[0.06] blur-[90px]" />

              {/* Modal header */}
              <div className="relative flex items-center justify-between border-b border-white/[0.07] px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.04]">
                    <Info className="h-5 w-5 text-gray-300" />
                  </div>

                  <div>
                    <h2 className="font-semibold text-white">
                      About the Developer
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                      The person behind VoteSphere
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDeveloperModal(false)}
                  aria-label="Close developer information"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-gray-400 transition hover:bg-white/[0.09] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal content */}
              <div className="relative p-6 sm:p-7">
                {/* Business logo */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-[28px] border border-white/[0.1] bg-white/[0.045] p-3 shadow-xl shadow-black/20">
                    <Image
                      src="/business-logo.png"
                      alt="Business logo"
                      fill
                      sizes="128px"
                      className="object-contain p-3"
                    />
                  </div>

                  <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                    <Sparkles className="h-3 w-3" />
                    Meet the developer
                  </span>

                  <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">
                    Solomon Arthur
                  </h3>

                  <p className="mt-1 text-sm text-gray-400">
                    Application Developer
                  </p>
                </div>

                {/* Developer information */}
                <div className="mt-7 space-y-3">
                  <div className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.045]">
                      <Code2 className="h-5 w-5 text-gray-300" />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-gray-500">
                        Working name
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-100">
                        VisionCraft
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.045]">
                      <Users className="h-5 w-5 text-gray-300" />
                    </div>
              
                  </div>

                  <div className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.045]">
                      <BriefcaseBusiness className="h-5 w-5 text-gray-300" />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-gray-500">
                        Development and technology
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-100">
                        Digital solutions and application development
                      </p>
                    </div>
                  </div>
                </div>

                {/* About message */}
                <div className="mt-5 rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.035] p-5">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-emerald-300" />
                    <h4 className="text-sm font-semibold text-gray-100">
                      Built with purpose.
                    </h4>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    VoteSphere is presented as a modern digital election
                    experience. The application is designed to provide a secure and user-friendly platform for managing elections and voting processes.    
                    
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-5">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-gray-300">
                      VisionCraft <span className="text-emerald-400">·</span> MKN
                    </p>
                    <p className="mt-1 text-[10px] text-gray-600">
                      Behind the VoteSphere experience
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDeveloperModal(false)}
                    className="rounded-xl border border-white/[0.1] bg-white/[0.045] px-5 py-2.5 text-xs font-semibold text-gray-200 transition hover:bg-white/[0.09]"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIGN OUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 px-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !loggingOut) {
              setShowLogoutModal(false);
            }
          }}
        >
          <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute -inset-1 rounded-[28px] bg-red-500/[0.07] blur-2xl" />

            <div className="relative overflow-hidden rounded-[26px] border border-red-400/15 bg-[#101310] p-6 shadow-2xl shadow-black/50 sm:p-7">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/15 bg-red-400/[0.08]">
                <LogOut className="h-6 w-6 text-red-400" />
              </div>

              <h2 className="mt-5 text-xl font-semibold text-white">
                Are you sure?
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-400">
                Are you sure you want to sign out of your VoteSphere account?
                You will need to log in again to access your workspace.
              </p>

              {error && (
                <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={() => {
                    setShowLogoutModal(false);
                    setError("");
                  }}
                  className="rounded-xl border border-white/[0.09] bg-white/[0.035] px-5 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/[0.08] disabled:opacity-50"
                >
                  No, stay
                </button>

                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loggingOut ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Signing out...
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4" />
                      Yes, sign out
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
