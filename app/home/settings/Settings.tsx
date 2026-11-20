
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
  Sparkles,
  ChevronRight,
  Mail,
  Info,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";

// ------------------------------------------------------
// TYPES
// ------------------------------------------------------

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

// ------------------------------------------------------
// APPLICATION SETTINGS
// ------------------------------------------------------

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

// ------------------------------------------------------
// SETTINGS PAGE
// ------------------------------------------------------

export default function SettingsPage() {
  const router = useRouter();

  // Account state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Logout state
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  // Modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);

  // ------------------------------------------------------
  // FETCH AUTHENTICATED USER
  // ------------------------------------------------------

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
        if (active) {
          setLoading(false);
        }
      }
    };

    getUser();

    return () => {
      active = false;
    };
  }, []);

  // ------------------------------------------------------
  // HANDLE ESCAPE KEY FOR MODALS
  // ------------------------------------------------------

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loggingOut) {
        setShowDeveloperModal(false);
        setShowLogoutModal(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [loggingOut]);

  // ------------------------------------------------------
  // USER INFORMATION
  // ------------------------------------------------------

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

  // ------------------------------------------------------
  // SIGN OUT
  // ------------------------------------------------------

  const handleLogout = async () => {
    if (loggingOut) return;

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

  // ------------------------------------------------------
  // OPEN LOGOUT MODAL
  // ------------------------------------------------------

  const openLogoutModal = () => {
    setError("");
    setShowLogoutModal(true);
  };

  // ------------------------------------------------------
  // RENDER
  // ------------------------------------------------------

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#050b08] px-4 py-8 text-white sm:px-6 lg:px-10"
      style={{
        backgroundImage: `
          radial-gradient(circle at 10% 5%, rgba(16,185,129,0.09), transparent 32%),
          radial-gradient(circle at 95% 35%, rgba(16,185,129,0.055), transparent 30%),
          radial-gradient(circle at 50% 100%, rgba(20,184,166,0.045), transparent 38%),
          radial-gradient(rgba(255,255,255,0.035) 0.7px, transparent 0.7px)
        `,
        backgroundSize: "auto, auto, auto, 28px 28px",
      }}
    >
      {/* --------------------------------------------------
          STATIC BACKGROUND DECORATION
      -------------------------------------------------- */}

      <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-emerald-500/[0.055] blur-[130px]" />

      <div className="pointer-events-none absolute -right-40 top-96 h-96 w-96 rounded-full bg-emerald-400/[0.045] blur-[130px]" />

      <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-teal-500/[0.035] blur-[120px]" />

      {/* MAIN CONTENT */}

      <div className="relative mx-auto max-w-7xl">

        {/* --------------------------------------------------
            HEADER
        -------------------------------------------------- */}

        <header className="mb-9">
          <div className="mb-3 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.09] bg-white/[0.045] shadow-lg shadow-emerald-950/20">
              <Settings className="h-5 w-5 text-gray-300" />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-400">
                Account workspace
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                Settings<span className="text-emerald-400">.</span>
              </h1>
            </div>

          </div>

          <p className="max-w-2xl text-sm leading-6 text-gray-400">
            Manage your account, review your application preferences, and
            learn more about the people behind VoteSphere.
          </p>
        </header>

        {/* --------------------------------------------------
            MAIN LAYOUT
        -------------------------------------------------- */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.85fr_1.4fr]">

          {/* --------------------------------------------------
              ACCOUNT CARD
          -------------------------------------------------- */}

          <section className="h-fit overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0b1510]/95 shadow-2xl shadow-black/30">

            {/* Card Header */}

            <div className="border-b border-white/[0.07] px-6 py-5">

              <div className="flex items-center gap-3">
                <UserRound className="h-5 w-5 text-gray-400" />

                <h2 className="font-semibold">
                  Your account
                </h2>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Your currently authenticated account information.
              </p>

            </div>

            {/* Account Information */}

            <div className="p-6">

              {loading ? (

                <div className="flex min-h-36 items-center justify-center">
                  <LoaderCircle className="h-6 w-6 animate-spin text-emerald-400" />
                </div>

              ) : (

                <>

                  {/* Profile */}

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

                  {/* Email Information */}

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

                  {/* Account Description */}

                  <p className="mt-4 text-xs leading-5 text-gray-500">
                    Your account information is displayed here for reference.
                    Profile editing is not currently available.
                  </p>

                </>

              )}

            </div>

          </section>

          {/* --------------------------------------------------
              APPLICATION SETTINGS CARD
          -------------------------------------------------- */}

          <section className="overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0b1510]/95 shadow-2xl shadow-black/30">

            {/* Card Header */}

            <div className="border-b border-white/[0.07] px-6 py-5">

              <div className="flex items-center gap-3">

                <Settings className="h-5 w-5 text-gray-400" />

                <h2 className="font-semibold">
                  Application settings
                </h2>

              </div>

              <p className="mt-1 text-sm text-gray-500">
                Your VoteSphere application preferences and information.
              </p>

            </div>

            <div className="p-3 sm:p-4">

              {/* --------------------------------------------------
                  EXISTING SETTINGS
              -------------------------------------------------- */}

              <div className="space-y-1">

                {settings.map((item) => {

                  const Icon = item.icon;

                  return (

                    <div
                      key={item.title}
                      className="group flex items-center gap-4 rounded-2xl px-3 py-4 transition-all duration-200 hover:bg-white/[0.035] sm:px-4"
                    >

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] transition-all duration-200 group-hover:border-emerald-400/15 group-hover:bg-emerald-400/[0.045]">

                        <Icon className="h-[19px] w-[19px] text-gray-400 transition-colors group-hover:text-emerald-300" />

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

              {/* --------------------------------------------------
                  ABOUT THE DEVELOPER
              -------------------------------------------------- */}

              <div className="my-3 border-t border-white/[0.07]" />

              <button
                type="button"
                onClick={() => setShowDeveloperModal(true)}
                className="group flex w-full items-center gap-4 rounded-2xl px-3 py-4 text-left transition-all duration-200 hover:bg-emerald-400/[0.045] sm:px-4"
              >

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] transition-all duration-200 group-hover:border-emerald-400/20 group-hover:bg-emerald-400/[0.06]">

                  <Info className="h-[19px] w-[19px] text-gray-400 transition-colors group-hover:text-emerald-300" />

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

                  <ChevronRight className="h-4 w-4 text-gray-500 transition-all duration-200 group-hover:translate-x-1 group-hover:text-emerald-300" />

                </div>

              </button>

              {/* --------------------------------------------------
                  SIGN OUT
              -------------------------------------------------- */}

              <div className="my-3 border-t border-white/[0.07]" />

              <div className="flex flex-col gap-4 rounded-2xl px-3 py-4 transition-colors duration-200 hover:bg-red-400/[0.025] sm:flex-row sm:items-center sm:justify-between sm:px-4">

                <div className="flex items-center gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-400/10 bg-red-400/[0.055] shadow-lg shadow-red-950/10">

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
                  onClick={openLogoutModal}
                  className="rounded-xl border border-red-400/20 bg-red-400/[0.07] px-5 py-2.5 text-xs font-semibold text-red-300 transition-all duration-200 hover:border-red-400/40 hover:bg-red-400/[0.13] hover:shadow-lg hover:shadow-red-950/20 sm:ml-auto"
                >
                  Sign out
                </button>

              </div>

            </div>

          </section>

        </div>

        {/* --------------------------------------------------
            FOOTER
        -------------------------------------------------- */}

        <p className="mt-8 text-center text-xs text-gray-600">
          VoteSphere · Account and application settings
        </p>

      </div>

      {/* ==================================================
          ABOUT THE DEVELOPER MODAL
      ================================================== */}

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

            {/* Emerald Modal Glow */}

            <div className="pointer-events-none absolute -inset-1 rounded-[30px] bg-emerald-500/[0.10] blur-2xl" />

            {/* Modal Container */}

            <div className="relative overflow-hidden rounded-[28px] border border-white/[0.11] bg-[#0b1510] shadow-2xl shadow-black/50">

              {/* Static Modal Decoration */}

              <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-400/[0.08] blur-[90px]" />

              <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-teal-400/[0.06] blur-[90px]" />

              {/* --------------------------------------------------
                  MODAL HEADER
              -------------------------------------------------- */}

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
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-gray-400 transition-all hover:border-white/[0.15] hover:bg-white/[0.09] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>

              </div>

              {/* --------------------------------------------------
                  MODAL CONTENT
              -------------------------------------------------- */}

              <div className="relative p-6 sm:p-7">

                {/* Developer Profile */}

                <div className="flex flex-col items-center text-center">

                  {/* Business Logo With Emerald Glow */}

                  <div className="relative">

                    {/* Outer Glow */}

                    <div className="pointer-events-none absolute -inset-4 rounded-[32px] bg-emerald-400/[0.16] blur-2xl" />

                    {/* Logo Container */}

                    <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-[26px] border border-emerald-400/20 bg-[#101b14] p-3 shadow-[0_0_25px_rgba(16,185,129,0.12),0_12px_35px_rgba(0,0,0,0.45)]">

                      <Image
                        src="/business-logo.png"
                        alt="Business logo"
                        fill
                        priority
                        sizes="128px"
                        className="rounded-[22px] object-contain p-3"
                      />

                    </div>

                  </div>

                  {/* Developer Badge */}

                  <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">

                    <Sparkles className="h-3 w-3" />

                    Meet the developer

                  </span>

                  {/* Developer Name */}

                  <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">
                    Solomon Arthur
                  </h3>

                  <p className="mt-1 text-sm text-gray-400">
                    Application Developer
                  </p>

                </div>

                {/* --------------------------------------------------
                    DEVELOPER INFORMATION
                -------------------------------------------------- */}

                <div className="mt-7 space-y-3">

                  {/* Working Name */}

                  <div className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition-colors hover:bg-white/[0.04]">

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

                </div>

                {/* --------------------------------------------------
                    ABOUT MESSAGE
                -------------------------------------------------- */}

                <div className="mt-5 rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.035] p-5">

                  <div className="flex items-center gap-2">

                    <Building2 className="h-4 w-4 text-emerald-300" />

                    <h4 className="text-sm font-semibold text-gray-100">
                      Built with purpose.
                    </h4>

                  </div>

                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    VoteSphere is presented as a modern digital election
                    experience. The application is designed to provide a
                    secure and user-friendly platform for managing elections
                    and voting processes.
                  </p>

                </div>

                {/* --------------------------------------------------
                    MODAL FOOTER
                -------------------------------------------------- */}

                <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-5">

                  <div>

                    <p className="text-xs font-semibold tracking-wide text-gray-300">
                      VisionCraft <span className="text-emerald-400">·</span>
                    </p>

                    <p className="mt-1 text-[10px] text-gray-600">
                      Behind the VoteSphere experience
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDeveloperModal(false)}
                    className="rounded-xl border border-white/[0.1] bg-white/[0.045] px-5 py-2.5 text-xs font-semibold text-gray-200 transition-all hover:border-emerald-400/20 hover:bg-white/[0.09]"
                  >
                    Close
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* ==================================================
          SIGN OUT CONFIRMATION MODAL
      ================================================== */}

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

            {/* Red Modal Glow */}

            <div className="pointer-events-none absolute -inset-1 rounded-[28px] bg-red-500/[0.08] blur-2xl" />

            {/* Modal Container */}

            <div className="relative overflow-hidden rounded-[26px] border border-red-400/15 bg-[#101310] p-6 shadow-2xl shadow-black/50 sm:p-7">

              {/* Logout Icon */}

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/15 bg-red-400/[0.08] shadow-lg shadow-red-950/20">

                <LogOut className="h-6 w-6 text-red-400" />

              </div>

              {/* Modal Heading */}

              <h2 className="mt-5 text-xl font-semibold text-white">
                Are you sure?
              </h2>

              {/* Modal Description */}

              <p className="mt-3 text-sm leading-6 text-gray-400">
                Are you sure you want to sign out of your VoteSphere account?
                You will need to log in again to access your workspace.
              </p>

              {/* Error Message */}

              {error && (

                <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-300">
                  {error}
                </div>

              )}

              {/* Modal Actions */}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                {/* Cancel */}

                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={() => {
                    setShowLogoutModal(false);
                    setError("");
                  }}
                  className="rounded-xl border border-white/[0.09] bg-white/[0.035] px-5 py-3 text-sm font-medium text-gray-300 transition-all hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  No, stay
                </button>

                {/* Confirm Logout */}

                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500 px-5 py-3 text-sm font-semibold text-white transition-all hover:border-red-400/40 hover:bg-red-400 hover:shadow-lg hover:shadow-red-950/20 disabled:cursor-not-allowed disabled:opacity-60"
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
