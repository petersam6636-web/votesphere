
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Clock3,
  Vote,
  Users,
  UserRound,
  MessageSquare,
  Trophy,
  ShieldCheck,
  Hourglass,
  CalendarDays,
  Flag,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Timer,
  Zap,
} from "lucide-react";

import { supabase } from "@/lib/supabase-client";
import useApp from "@/lib/useApp";

import type { Project } from "@/types/project";

type TimeLeft = {
  years: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const YEAR = 365 * 24 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

function calculateTimeLeft(milliseconds: number): TimeLeft {
  let remaining = Math.max(0, milliseconds);

  const years = Math.floor(remaining / YEAR);
  remaining %= YEAR;

  const days = Math.floor(remaining / DAY);
  remaining %= DAY;

  const hours = Math.floor(remaining / HOUR);
  remaining %= HOUR;

  const minutes = Math.floor(remaining / MINUTE);
  remaining %= MINUTE;

  const seconds = Math.floor(remaining / 1000);

  return {
    years,
    days,
    hours,
    minutes,
    seconds,
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ActiveProject() {
  const {
    userInfo,
    project,
    setProject,
    setTaskKey,
  } = useApp();

  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);

  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState("");

  const endingRef = useRef(false);

  // Get the earliest project belonging to the authenticated user.
  useEffect(() => {
    if (!userInfo) return;

    let active = true;

    const loadProject = async () => {
      setLoading(true);
      setError("");

      try {
        // Find the earliest project already available in shared state.
        const cachedProject = [...(project ?? [])]
          .filter((item) => item.user_id === userInfo && !item.deleted)
          .sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          )[0];

        // Check whether the cached project already contains voters.
        const hasCompleteData =
          cachedProject &&
          Array.isArray(cachedProject.nominees) &&
          cachedProject.nominees.every(
            (nominee) => Array.isArray(nominee.voters)
          );

        let selectedProject: Project;

        if (hasCompleteData) {
          // Reuse the complete project from shared state.
          selectedProject = cachedProject;
        } else {
          // Fetch the earliest project and its related records.
          const { data, error: fetchError } = await supabase
            .from("projects")
            .select(`
              *,
              nominees (
                *,
                achievements (*),
                voters (*)
              )
            `)
            .eq("user_id", userInfo)
            .eq("deleted", false)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

          if (fetchError) throw fetchError;

          if (!data) {
            throw new Error("No active election project was found.");
          }

          selectedProject = data as Project;

          // Save the fetched project in shared state.
          const updatedProjects = [
            ...(project ?? []).filter(
              (item) => item.id !== selectedProject.id
            ),
            selectedProject,
          ].sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );

          setProject(updatedProjects);
        }

        if (!active) return;

        setActiveProject(selectedProject);

        // Calculate the remaining time from the original creation date.
        const expiryTime =
          new Date(selectedProject.created_at).getTime() +
          selectedProject.duration_ms;

        setRemainingMs(Math.max(0, expiryTime - Date.now()));
      } catch (err: unknown) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your election."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadProject();

    return () => {
      active = false;
    };
  }, [userInfo, project, setProject]);

  // End the election and update both Supabase and shared state.
  const endElection = useCallback(async () => {
    if (!userInfo || endingRef.current) return;

    endingRef.current = true;
    setEnding(true);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("tasks")
        .update({ key: false })
        .eq("user_id", userInfo);

      if (updateError) throw updateError;

      // Update the global state so HomePage renders FinishedProject.
      setTaskKey(false);
    } catch (err: unknown) {
      endingRef.current = false;

      setError(
        err instanceof Error
          ? err.message
          : "Unable to end the election. Please try again."
      );
    } finally {
      setEnding(false);
    }
  }, [userInfo, setTaskKey]);

  // Update the countdown every second.
  useEffect(() => {
    if (!activeProject || endingRef.current) return;

    const expiryTime =
      new Date(activeProject.created_at).getTime() +
      activeProject.duration_ms;

    const updateCountdown = () => {
      const remaining = Math.max(0, expiryTime - Date.now());

      setRemainingMs(remaining);

      if (remaining <= 0) {
        void endElection();
      }
    };

    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [activeProject, endElection]);

  // Loading screen.
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10">
            <Loader2 className="animate-spin text-emerald-400" size={25} />
          </div>

          <p className="text-sm font-medium text-zinc-400">
            Preparing your election dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Error screen.
  if (error && !activeProject) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 text-red-400" size={30} />

          <p role="alert" className="text-sm text-red-300">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!activeProject) return null;

  const time = calculateTimeLeft(remainingMs);
  const isUrgent = remainingMs <= 10_000;
  const nominees = activeProject.nominees ?? [];

  const totalVoters = nominees.reduce(
    (total, nominee) => total + (nominee.voters?.length ?? 0),
    0
  );

  const totalAchievements = nominees.reduce(
    (total, nominee) => total + (nominee.achievements?.length ?? 0),
    0
  );

  const timeUnits = [
    { label: "Years", value: time.years },
    { label: "Days", value: time.days },
    { label: "Hours", value: time.hours },
    { label: "Minutes", value: time.minutes },
    { label: "Seconds", value: time.seconds },
  ];

  return (
    <div className="w-full space-y-6 pb-8">
      {/* Election heading */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-[#103323] via-[#0c1c14] to-[#0b110e] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-400/[0.09] blur-[90px]" />

        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-teal-400/[0.05] blur-[80px]" />

        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              LIVE ELECTION
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 text-[11px] font-medium text-emerald-300">
              <ShieldCheck size={13} />
              Election Active
            </div>
          </div>

          <h1 className="mt-6 break-words text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {activeProject.name}
            <span className="text-emerald-400">.</span>
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
            {activeProject.description ||
              "Your election is currently running. Monitor the voting activity and track your nominees below."}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <CalendarDays size={15} className="text-emerald-400" />
              Started {formatDate(activeProject.created_at)}
            </div>

            <div className="flex items-center gap-2">
              <Users size={15} className="text-emerald-400" />
              {nominees.length} nominees
            </div>
          </div>
        </div>
      </section>

      {/* Countdown */}
      <section
        className={`relative overflow-hidden rounded-3xl border p-5 transition-colors duration-500 sm:p-7 ${
          isUrgent
            ? "border-red-500/30 bg-gradient-to-br from-[#351414] via-[#1c1111] to-[#100d0d]"
            : "border-emerald-400/15 bg-gradient-to-br from-[#10251b] via-[#101914] to-[#0c110e]"
        }`}
      >
        <div
          className={`pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full blur-[80px] transition-colors duration-500 ${
            isUrgent ? "bg-red-500/15" : "bg-emerald-400/[0.08]"
          }`}
        />

        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div
                className={`flex items-center gap-2 text-xs font-semibold tracking-widest ${
                  isUrgent ? "text-red-400" : "text-emerald-400"
                }`}
              >
                <Timer size={16} />
                ELECTION COUNTDOWN
              </div>

              <p className="mt-2 text-xs text-zinc-500">
                Time remaining before this election automatically ends
              </p>
            </div>

            <div
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-wider ${
                isUrgent
                  ? "border-red-500/25 bg-red-500/10 text-red-400"
                  : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              }`}
            >
              {isUrgent ? (
                <>
                  <Zap size={12} />
                  ENDING SOON
                </>
              ) : (
                <>
                  <Hourglass size={12} />
                  TIME REMAINING
                </>
              )}
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
            {timeUnits.map((unit) => (
              <div
                key={unit.label}
                className={`rounded-2xl border p-4 text-center transition-colors duration-500 sm:p-5 ${
                  isUrgent
                    ? "border-red-500/20 bg-red-500/[0.07]"
                    : "border-emerald-400/10 bg-black/20"
                }`}
              >
                <p
                  className={`font-mono text-3xl font-bold tabular-nums transition-colors duration-500 sm:text-4xl ${
                    isUrgent ? "text-red-400" : "text-white"
                  }`}
                >
                  {unit.label === "Years"
                    ? unit.value
                    : pad(unit.value)}
                </p>

                <p
                  className={`mt-2 text-[10px] font-semibold uppercase tracking-widest ${
                    isUrgent ? "text-red-300/60" : "text-zinc-500"
                  }`}
                >
                  {unit.label}
                </p>
              </div>
            ))}
          </div>

          {isUrgent && remainingMs > 0 && (
            <p className="mt-5 animate-pulse text-center text-xs font-semibold text-red-400">
              Less than 10 seconds remaining! The election is about to end.
            </p>
          )}

          <div
            className={`mt-6 h-1 overflow-hidden rounded-full ${
              isUrgent ? "bg-red-500/10" : "bg-emerald-400/10"
            }`}
          >
            <div
              className={`h-full rounded-full transition-colors duration-500 ${
                isUrgent ? "bg-red-500" : "bg-emerald-400"
              }`}
              style={{
                width: `${
                  activeProject.duration_ms > 0
                    ? Math.min(
                        100,
                        (remainingMs / activeProject.duration_ms) * 100
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          {
            label: "Total Nominees",
            value: nominees.length,
            icon: UserRound,
          },
          {
            label: "Total Voters",
            value: totalVoters,
            icon: Users,
          },
          {
            label: "Achievements",
            value: totalAchievements,
            icon: Trophy,
          },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/[0.07] bg-[#0d1310] p-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
                <Icon size={19} />
              </div>

              <p className="mt-4 text-2xl font-bold tabular-nums text-white">
                {stat.value.toLocaleString()}
              </p>

              <p className="mt-1 text-xs text-zinc-500">{stat.label}</p>
            </div>
          );
        })}
      </section>

      {/* Nominees */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">
              Election Nominees
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Nominees and their recorded voting activity.
            </p>
          </div>

          <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400">
            {nominees.length} total
          </div>
        </div>

        {nominees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d1310] px-5 py-12 text-center">
            <Users className="mx-auto mb-3 text-zinc-600" size={30} />

            <p className="text-sm font-medium text-zinc-300">
              No nominees yet
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Your election currently has no registered nominees.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {nominees.map((nominee, index) => (
              <article
                key={nominee.id}
                className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d1310]"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    {nominee.image ? (
                      <img
                        src={nominee.image}
                        alt={nominee.name}
                        className="h-12 w-12 rounded-xl border border-white/10 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/10 text-emerald-400">
                        <UserRound size={21} />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {nominee.name}
                      </p>

                      <p className="mt-1 text-[11px] text-zinc-500">
                        Nominee #{index + 1}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.06] px-3 py-2">
                    <Vote size={15} className="text-emerald-400" />

                    <span className="text-sm font-bold text-emerald-300">
                      {nominee.voters?.length ?? 0}
                    </span>

                    <span className="text-[11px] text-zinc-500">
                      Votes
                    </span>
                  </div>
                </div>

                {nominee.manifesto && (
                  <div className="border-t border-white/[0.06] px-5 py-4">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                      Manifesto
                    </p>

                    <p className="text-sm leading-6 text-zinc-400">
                      {nominee.manifesto}
                    </p>
                  </div>
                )}

                {/* Voters */}
                <div className="border-t border-white/[0.06] p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Users size={15} className="text-emerald-400" />

                    <h3 className="text-xs font-semibold text-zinc-300">
                      Recorded Voters
                    </h3>

                    <span className="text-[10px] text-zinc-600">
                      ({nominee.voters?.length ?? 0})
                    </span>
                  </div>

                  {!nominee.voters?.length ? (
                    <p className="text-xs text-zinc-600">
                      No voters recorded for this nominee yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {nominee.voters.map((voter) => (
                        <div
                          key={voter.id}
                          className="flex items-start gap-3 rounded-xl bg-white/[0.025] p-3"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
                            <UserRound size={15} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-zinc-200">
                              {voter.name || "Anonymous voter"}
                            </p>

                            {voter.comment ? (
                              <div className="mt-2 flex items-start gap-2">
                                <MessageSquare
                                  size={12}
                                  className="mt-0.5 shrink-0 text-zinc-600"
                                />

                                <p className="text-xs leading-5 text-zinc-500">
                                  {voter.comment}
                                </p>
                              </div>
                            ) : (
                              <p className="mt-1 text-[11px] text-zinc-600">
                                No comment provided.
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Error notification */}
      {error && activeProject && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4 text-xs text-red-300"
        >
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Force End */}
      <section className="relative overflow-hidden rounded-2xl border border-red-500/15 bg-gradient-to-br from-[#1c1212] to-[#100e0e] p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-500/15 bg-red-500/10 text-red-400">
              <Flag size={20} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-white">
                End this election
              </h2>

              <p className="mt-1 max-w-md text-xs leading-5 text-zinc-500">
                Manually end the election before its scheduled countdown
                expires. This will deactivate voting immediately.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void endElection()}
            disabled={ending}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-xs font-semibold text-red-300 transition-all hover:border-red-500/40 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ending ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Ending Election...
              </>
            ) : (
              <>
                <Flag size={15} />
                Force End Election
              </>
            )}
          </button>
        </div>
      </section>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 pb-2 text-[10px] text-zinc-600">
        <CheckCircle2 size={12} className="text-emerald-500/70" />
        VoteSphere Election Management
      </div>
    </div>
  );
}
