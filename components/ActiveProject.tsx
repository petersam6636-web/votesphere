
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  Vote,
  Users,
  UserRound,
  MessageSquare,
  Trophy,
  ShieldCheck,
  CalendarDays,
  Flag,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Timer,
  Zap,
  Hourglass,
  Sparkles,
  Radio,
} from "lucide-react";

import { supabase } from "@/lib/supabase-client";
import useApp from "@/lib/useApp";

import ProjectLoading from "@/components/ProjectLoading";

import type { Project } from "@/types/project";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

function calculateTimeLeft(milliseconds: number): TimeLeft {
  const remaining = Math.max(0, milliseconds);

  const days = Math.floor(remaining / DAY);
  const hours = Math.floor((remaining % DAY) / HOUR);
  const minutes = Math.floor((remaining % HOUR) / MINUTE);
  const seconds = Math.floor((remaining % MINUTE) / 1000);

  return {
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
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ActiveProject() {
  const { userInfo, setProject, setTaskKey } = useApp();

  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);

  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState("");

  // Prevent multiple automatic or manual ending requests.
  const endingRef = useRef(false);

  // --------------------------------------------------
  // LOAD THE USER'S EARLIEST ACTIVE PROJECT
  // --------------------------------------------------

  useEffect(() => {
    if (!userInfo) {
      setLoading(false);
      return;
    }

    let active = true;

    const loadProject = async () => {
      setLoading(true);
      setError("");

      try {
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

        if (fetchError) {
          throw fetchError;
        }

        if (!data) {
          throw new Error("No active election project was found.");
        }

        const selectedProject = data as Project;

        // duration_ms stores the absolute expiration timestamp.
        const expirationTime = Number(selectedProject.duration_ms);

        const createdAt = new Date(
          selectedProject.created_at
        ).getTime();

        if (
          !Number.isFinite(expirationTime) ||
          !Number.isFinite(createdAt) ||
          expirationTime < createdAt
        ) {
          throw new Error(
            "The saved election expiration time or creation date is invalid."
          );
        }

        if (!active) return;

        const remainingTime = Math.max(
          0,
          expirationTime - Date.now()
        );

        setRemainingMs(remainingTime);
        setActiveProject(selectedProject);

        // Save the fetched project and its nested data in shared state.
        setProject([selectedProject]);
      } catch (err: unknown) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your election."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadProject();

    return () => {
      active = false;
    };
  }, [userInfo, setProject]);

  // --------------------------------------------------
  // END ELECTION
  // --------------------------------------------------

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

      if (updateError) {
        throw updateError;
      }

      // Update shared state immediately.
      // HomePage can now render FinishedProject.
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

  // --------------------------------------------------
  // LIVE COUNTDOWN
  // --------------------------------------------------

  useEffect(() => {
    if (!activeProject || endingRef.current) return;

    const expirationTime = Number(activeProject.duration_ms);

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        expirationTime - Date.now()
      );

      setRemainingMs(remaining);

      if (remaining <= 0) {
        void endElection();
      }
    };

    updateCountdown();

    const interval = window.setInterval(
      updateCountdown,
      1000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [activeProject, endElection]);

  // --------------------------------------------------
  // LOADING SCREEN
  // --------------------------------------------------

  if (loading) {
    return <ProjectLoading />;
  }

  // --------------------------------------------------
  // ERROR SCREEN
  // --------------------------------------------------

  if (error && !activeProject) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-red-500/15 bg-[#170f0f] p-7 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
            <AlertCircle className="text-red-400" size={23} />
          </div>

          <h2 className="mt-4 text-base font-semibold text-white">
            Unable to load election
          </h2>

          <p
            role="alert"
            className="mt-2 text-sm leading-6 text-red-300/80"
          >
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!activeProject) return null;

  // --------------------------------------------------
  // DASHBOARD DATA
  // --------------------------------------------------

  const time = calculateTimeLeft(remainingMs);

  const isUrgent = remainingMs <= 10_000;
  const isExpired = remainingMs <= 0;

  const nominees = activeProject.nominees ?? [];

  const totalVoters = nominees.reduce(
    (total, nominee) =>
      total + (nominee.voters?.length ?? 0),
    0
  );

  const totalAchievements = nominees.reduce(
    (total, nominee) =>
      total + (nominee.achievements?.length ?? 0),
    0
  );

  const expirationTime = Number(activeProject.duration_ms);
  const createdAt = new Date(activeProject.created_at).getTime();

  const totalDuration = expirationTime - createdAt;
  const elapsedTime = Date.now() - createdAt;

  const progress =
    totalDuration > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (elapsedTime / totalDuration) * 100
          )
        )
      : 100;

  const timeUnits = [
    { label: "Days", value: time.days },
    { label: "Hours", value: time.hours },
    { label: "Minutes", value: time.minutes },
    { label: "Seconds", value: time.seconds },
  ];

  // --------------------------------------------------
  // DASHBOARD UI
  // --------------------------------------------------

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-6">

      {/* ELECTION HEADER */}

      <section className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-[#103323] via-[#0c1c14] to-[#0b110e] p-6 sm:p-8">
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
              <CalendarDays
                size={15}
                className="text-emerald-400"
              />
              Started {formatDate(activeProject.created_at)}
            </div>

            <div className="flex items-center gap-2">
              <Users
                size={15}
                className="text-emerald-400"
              />
              {nominees.length} nominees
            </div>
          </div>
        </div>
      </section>

      {/* COUNTDOWN AND FLOATING BUBBLE */}

      <section
        className={`relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border transition-colors duration-500 lg:grid-cols-[minmax(0,1.5fr)_minmax(220px,0.7fr)] ${
          isUrgent
            ? "border-red-500/25 bg-gradient-to-br from-[#251313] via-[#171010] to-[#100d0d]"
            : "border-emerald-400/15 bg-gradient-to-br from-[#10251b] via-[#101914] to-[#0c110e]"
        }`}
      >
        {/* Ambient glow */}

        <div
          className={`pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full blur-[100px] ${
            isUrgent
              ? "bg-red-500/10"
              : "bg-emerald-400/[0.08]"
          }`}
        />

        {/* LEFT: COUNTDOWN */}

        <div className="relative min-w-0 p-5 sm:p-7 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div
                className={`flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] ${
                  isUrgent
                    ? "text-red-400"
                    : "text-emerald-400"
                }`}
              >
                <Timer size={15} />
                ELECTION COUNTDOWN
              </div>

              <h2 className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
                Time remaining
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Time left until voting closes.
              </p>
            </div>

            <div
              className={`flex items-center gap-2 rounded-full border px-3 py-2 text-[9px] font-bold tracking-wider ${
                isUrgent
                  ? "border-red-500/25 bg-red-500/10 text-red-400"
                  : "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300"
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
                  COUNTING DOWN
                </>
              )}
            </div>
          </div>

          {/* Modern countdown units */}

          <div className="mt-7 grid grid-cols-4 gap-2 sm:gap-3">
            {timeUnits.map((unit, index) => (
              <div
                key={unit.label}
                className="group min-w-0 text-center"
              >
                <div
                  className={`relative flex aspect-[1/1.05] min-h-[65px] items-center justify-center overflow-hidden rounded-xl border transition-all duration-300 sm:rounded-2xl ${
                    isUrgent
                      ? "border-red-500/20 bg-[#251010]"
                      : "border-white/[0.08] bg-[#080e0b]/80 group-hover:border-emerald-400/25 group-hover:bg-emerald-400/[0.04]"
                  }`}
                >
                  <div
                    className={`pointer-events-none absolute inset-x-0 top-0 h-px ${
                      isUrgent
                        ? "bg-red-400/30"
                        : "bg-emerald-300/20"
                    }`}
                  />

                  <span
                    className={`relative font-mono text-2xl font-bold tracking-tighter tabular-nums sm:text-3xl md:text-4xl ${
                      isUrgent
                        ? "text-red-400"
                        : index === 3
                          ? "text-emerald-300"
                          : "text-white"
                    }`}
                  >
                    {pad(unit.value)}
                  </span>

                  <div
                    className={`pointer-events-none absolute bottom-0 left-1/2 h-1 w-1/3 -translate-x-1/2 rounded-full blur-md ${
                      isUrgent
                        ? "bg-red-400/30"
                        : "bg-emerald-400/20"
                    }`}
                  />
                </div>

                <p
                  className={`mt-2 text-[9px] font-bold uppercase tracking-[0.12em] sm:text-[10px] ${
                    isUrgent
                      ? "text-red-300/60"
                      : "text-zinc-500"
                  }`}
                >
                  {unit.label}
                </p>
              </div>
            ))}
          </div>

          {isUrgent && !isExpired && (
            <p className="mt-5 flex items-center justify-center gap-2 text-center text-[11px] font-semibold text-red-400">
              <Zap size={13} />
              Less than 10 seconds remaining
            </p>
          )}

          {isExpired && (
            <p className="mt-5 text-center text-[11px] font-semibold text-red-400">
              Election time has expired. Finishing your election...
            </p>
          )}

          {/* Progress */}

          <div className="mt-7">
            <div className="mb-2 flex items-center justify-between gap-3 text-[10px]">
              <span className="font-medium text-zinc-500">
                Election time elapsed
              </span>

              <span
                className={`font-semibold tabular-nums ${
                  isUrgent
                    ? "text-red-400"
                    : "text-emerald-400"
                }`}
              >
                {progress.toFixed(1)}%
              </span>
            </div>

            <div
              className={`h-1.5 overflow-hidden rounded-full ${
                isUrgent
                  ? "bg-red-500/10"
                  : "bg-emerald-400/10"
              }`}
            >
              <div
                className={`h-full rounded-full transition-[width] duration-1000 ${
                  isUrgent
                    ? "bg-red-500"
                    : "bg-emerald-400"
                }`}
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT: FLOATING ELECTION BUBBLE */}

        <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden border-t border-white/[0.06] px-6 py-8 lg:min-h-0 lg:border-l lg:border-t-0">
          {/* Background glow */}

          <div
            className={`pointer-events-none absolute h-52 w-52 rounded-full blur-[70px] ${
              isUrgent
                ? "bg-red-500/[0.10]"
                : "bg-emerald-400/[0.10]"
            }`}
          />

          {/* Decorative floating orbs */}

          <div
            className={`absolute right-[15%] top-[12%] h-3 w-3 animate-[bounce_4s_ease-in-out_infinite] rounded-full border ${
              isUrgent
                ? "border-red-300/40 bg-red-400/20"
                : "border-emerald-300/40 bg-emerald-400/20"
            }`}
          />

          <div
            className={`absolute bottom-[17%] left-[13%] h-5 w-5 animate-[bounce_5s_ease-in-out_infinite] rounded-full border ${
              isUrgent
                ? "border-red-300/30 bg-red-400/10"
                : "border-emerald-300/30 bg-emerald-400/10"
            }`}
          />

          <div className="relative flex flex-col items-center text-center">
            {/* Main floating bubble */}

            <div className="relative flex h-36 w-36 animate-[bounce_5s_ease-in-out_infinite] items-center justify-center sm:h-40 sm:w-40">
              <div
                className={`absolute inset-0 rounded-full border ${
                  isUrgent
                    ? "border-red-400/20"
                    : "border-emerald-400/20"
                }`}
              />

              <div
                className={`absolute inset-3 rounded-full border ${
                  isUrgent
                    ? "border-red-400/10"
                    : "border-emerald-400/10"
                }`}
              />

              <div
                className={`absolute inset-5 rounded-full blur-md ${
                  isUrgent
                    ? "bg-red-400/[0.08]"
                    : "bg-emerald-400/[0.08]"
                }`}
              />

              <div
                className={`relative flex h-24 w-24 items-center justify-center rounded-full border shadow-[inset_0_0_30px_rgba(255,255,255,0.025),0_0_45px_rgba(16,185,129,0.08)] sm:h-28 sm:w-28 ${
                  isUrgent
                    ? "border-red-400/25 bg-[#291414]"
                    : "border-emerald-400/25 bg-[#10251b]"
                }`}
              >
                {isUrgent ? (
                  <Zap
                    size={35}
                    className="text-red-400"
                    strokeWidth={1.5}
                  />
                ) : (
                  <ShieldCheck
                    size={37}
                    className="text-emerald-400"
                    strokeWidth={1.4}
                  />
                )}
              </div>

              {/* Small floating sparkles */}

              <div
                className={`absolute right-3 top-5 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md ${
                  isUrgent
                    ? "border-red-400/20 bg-red-400/10 text-red-300"
                    : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                }`}
              >
                <Sparkles size={14} />
              </div>

              <div
                className={`absolute bottom-5 left-1 flex h-7 w-7 items-center justify-center rounded-full border backdrop-blur-md ${
                  isUrgent
                    ? "border-red-400/20 bg-red-400/10 text-red-300"
                    : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                }`}
              >
                <Radio size={12} />
              </div>
            </div>

            <div className="relative mt-5">
              <p
                className={`text-[10px] font-bold tracking-[0.22em] ${
                  isUrgent
                    ? "text-red-400"
                    : "text-emerald-400"
                }`}
              >
                {isUrgent ? "FINAL MOMENTS" : "VOTING IN PROGRESS"}
              </p>

              <h3 className="mt-2 text-lg font-bold tracking-tight text-white">
                {isUrgent ? "Almost there" : "Your election is live"}
              </h3>

              <p className="mx-auto mt-1 max-w-[220px] text-[11px] leading-5 text-zinc-500">
                {isUrgent
                  ? "The election is approaching its scheduled closing time."
                  : "Your voting space is active. Every vote counts."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STATISTICS */}

      <section className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-3 sm:grid-cols-3">
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

              <p className="mt-1 text-xs text-zinc-500">
                {stat.label}
              </p>
            </div>
          );
        })}
      </section>

      {/* NOMINEES */}

      <section className="mx-auto w-full max-w-6xl space-y-4">
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
            <Users
              className="mx-auto mb-3 text-zinc-600"
              size={30}
            />

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
                {/* Nominee information */}

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
                    <Vote
                      size={15}
                      className="text-emerald-400"
                    />

                    <span className="text-sm font-bold text-emerald-300">
                      {nominee.voters?.length ?? 0}
                    </span>

                    <span className="text-[11px] text-zinc-500">
                      Votes
                    </span>
                  </div>
                </div>

                {/* Manifesto */}

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
                    <Users
                      size={15}
                      className="text-emerald-400"
                    />

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

      {/* ERROR NOTIFICATION */}

      {error && activeProject && (
        <div
          role="alert"
          className="mx-auto flex w-full max-w-6xl items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4 text-xs text-red-300"
        >
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* FORCE END */}

      <section className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-red-500/15 bg-gradient-to-br from-[#1c1212] to-[#100e0e] p-5 sm:p-6">
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
            disabled={ending || isExpired}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-xs font-semibold text-red-300 transition-all hover:border-red-500/40 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ending ? (
              <>
                <Loader2
                  size={15}
                  className="animate-spin"
                />
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

      {/* FOOTER */}

      <div className="flex items-center justify-center gap-2 pb-2 text-[10px] text-zinc-600">
        <CheckCircle2
          size={12}
          className="text-emerald-500/70"
        />
        VoteSphere Election Management
      </div>
    </div>
  );
}
