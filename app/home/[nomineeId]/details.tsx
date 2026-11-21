
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  MessageCircle,
  Trophy,
  Users,
  Vote,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import useApp from "@/lib/useApp";
import ProjectLoading from "@/components/ProjectLoading";

type Voter = {
  id?: string;
  nominee_id?: string;
  name?: string | null;
  comment?: string | null;
};

type Achievement = {
  id?: string;
  nominee_id?: string;
  project?: string | null;
  created_at?: string | null;
};

type Nominee = {
  id: string;
  project_id?: string;
  user_id?: string;
  name?: string | null;
  manifesto?: string | null;
  image?: string | null;
  created_at?: string | null;
  achievements?: Achievement[] | null;
  voters?: Voter[] | null;
};

type Project = {
  id: string;
  name?: string | null;
  created_at?: string | null;
  nominees?: Nominee[] | null;
};

type ProjectLookup = {
  nomineeId: string;
  project: Project | null;
  error: string;
};

type DetailsProps = {
  nomineeId: string;
};

function formatDate(date?: string | null): string {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DetailsPage({ nomineeId }: DetailsProps) {
  const { project } = useApp();
  const [lookup, setLookup] = useState<ProjectLookup>({
    nomineeId: "",
    project: null,
    error: "",
  });

  const contextProject = useMemo(
    () =>
      ((project ?? []) as Project[]).find((item) =>
        item.nominees?.some((nominee) => nominee.id === nomineeId)
      ) ?? null,
    [project, nomineeId]
  );

  useEffect(() => {
    if (contextProject || lookup.nomineeId === nomineeId) return;

    let active = true;

    const loadProject = async () => {
      let loadedProject: Project | null = null;
      let errorMessage = "";

      try {
        const { data: nomineeRecord, error: nomineeError } = await supabase
          .from("nominees")
          .select("project_id")
          .eq("id", nomineeId)
          .maybeSingle();

        if (nomineeError) throw nomineeError;
        if (!nomineeRecord) {
          throw new Error("This nominee could not be found.");
        }

        const { data: projectRecord, error: projectError } = await supabase
          .from("projects")
          .select(`
            *,
            nominees (
              *,
              achievements (*),
              voters (*)
            )
          `)
          .eq("id", nomineeRecord.project_id)
          .eq("deleted", false)
          .maybeSingle();

        if (projectError) throw projectError;
        if (!projectRecord) {
          throw new Error("The project for this nominee could not be found.");
        }

        loadedProject = projectRecord as Project;
      } catch (error: unknown) {
        errorMessage =
          error instanceof Error
            ? error.message
            : "Unable to load this nominee.";
      }

      if (active) {
        setLookup({
          nomineeId,
          project: loadedProject,
          error: errorMessage,
        });
      }
    };

    void loadProject();

    return () => {
      active = false;
    };
  }, [contextProject, lookup.nomineeId, nomineeId]);

  const currentProject =
    contextProject ??
    (lookup.nomineeId === nomineeId ? lookup.project : null);
  const isLoading =
    !contextProject && lookup.nomineeId !== nomineeId;
  const lookupError =
    lookup.nomineeId === nomineeId ? lookup.error : "";

  const result = useMemo(() => {
    if (!currentProject) {
      return {
        nominee: null,
        rankedNominees: [] as Nominee[],
        rank: 0,
        voteCount: 0,
        leadingVotes: 0,
        totalVotes: 0,
        progress: 0,
        voteShare: 0,
      };
    }

    const nominees = currentProject.nominees ?? [];
    const nominee = nominees.find((item) => item.id === nomineeId) ?? null;

    const rankedNominees = nominees
      .slice()
      .sort(
        (a, b) =>
          (b.voters?.length ?? 0) - (a.voters?.length ?? 0)
      );

    const voteCount = nominee?.voters?.length ?? 0;
    const leadingVotes = Math.max(
      0,
      ...rankedNominees.map((item) => item.voters?.length ?? 0)
    );

    const totalVotes = rankedNominees.reduce(
      (total, item) => total + (item.voters?.length ?? 0),
      0
    );

    // Competition ranking: 1, 1, 3 when two nominees share first place.
    const rank = nominee
      ? rankedNominees.findIndex((item) => item.id === nominee.id) >= 0
        ? rankedNominees.filter(
            (item) =>
              (item.voters?.length ?? 0) > voteCount
          ).length + 1
        : 0
      : 0;

    const progress =
      leadingVotes > 0
        ? Math.round((voteCount / leadingVotes) * 100)
        : 0;

    const voteShare =
      totalVotes > 0
        ? Math.round((voteCount / totalVotes) * 100)
        : 0;

    return {
      nominee,
      rankedNominees,
      rank,
      voteCount,
      leadingVotes,
      totalVotes,
      progress,
      voteShare,
    };
  }, [currentProject, nomineeId]);

  const {
    nominee,
    rankedNominees,
    rank,
    voteCount,
    leadingVotes,
    totalVotes,
    progress,
    voteShare,
  } = result;

  const comments = (nominee?.voters ?? [])
    .map((voter) => voter.comment?.trim())
    .filter((comment): comment is string => Boolean(comment));

  if (isLoading) {
    return <ProjectLoading />;
  }

  if (!currentProject) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden  px-2 py-2 text-white">
        <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />

        <div className="relative w-full max-w-md rounded-3xl border border-emerald-400/15 bg-[#0b1712]/90 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10">
            <Vote className="h-8 w-8 text-emerald-400" />
          </div>

          <h1 className="text-xl font-semibold text-white">
            Project unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            {lookupError ||
              "The project information is not currently available. Please return to your dashboard and try again."}
          </p>

          <Link
            href="/home"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-[#04120b] transition hover:bg-emerald-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (!nominee || !currentProject) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden  px-2 py-2 text-white">
        <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />

        <div className="relative w-full max-w-md rounded-3xl border border-emerald-400/15 bg-[#0b1712]/90 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10">
            <Users className="h-8 w-8 text-emerald-400" />
          </div>

          <h1 className="text-xl font-semibold text-white">
            Nominee not found
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            This nominee could not be found in the current project. The nominee
            may have been removed or may belong to another project.
          </p>

          <Link
            href="/home"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-[#04120b] transition hover:bg-emerald-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden  px-2 py-5 text-white">
      {/* Ambient background */}
      {/* <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-green-500/[0.07] blur-[140px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:radial-gradient(#a7f3d0_1px,transparent_1px)] [background-size:25px_25px]" /> */}

      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <Link
          href="/home/nominees"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-gray-300 transition hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <article className="overflow-hidden rounded-[2rem] border border-emerald-400/15 bg-[#0a1510]/95 shadow-[0_25px_100px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          {/* Profile header */}
          <div className="relative border-b border-white/[0.07] px-6 pb-8 pt-8 sm:px-10 sm:pt-10">
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-emerald-400/[0.08] blur-[75px]" />

            <div className="relative flex flex-col items-center text-center">
              <div className="relative mb-6">
                {nominee.image ? (
                  <img
                    src={nominee.image}
                    alt={nominee.name || "Nominee"}
                    className="h-32 w-32 rounded-[2rem] border-2 border-emerald-400/40 object-cover shadow-[0_0_35px_rgba(16,185,129,0.15)] sm:h-40 sm:w-40"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] border border-emerald-400/30 bg-emerald-400/10 text-4xl font-bold text-emerald-300 shadow-[0_0_35px_rgba(16,185,129,0.12)] sm:h-40 sm:w-40 sm:text-5xl">
                    {(nominee.name?.trim().charAt(0) || "?").toUpperCase()}
                  </div>
                )}

                {rank === 1 && (
                  <div className="absolute -bottom-3 -right-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-yellow-300/30 bg-[#30270d] shadow-lg">
                    <Trophy className="h-5 w-5 text-yellow-300" />
                  </div>
                )}
              </div>

              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Nominee profile
              </span>

              <h1 className="max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {nominee.name || "Unnamed nominee"}
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                {currentProject.name || "Election project"}
              </p>

              {nominee.created_at && (
                <p className="mt-3 inline-flex items-center gap-2 text-xs text-gray-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Joined {formatDate(nominee.created_at)}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-8 px-6 py-8 sm:px-10 sm:py-10">
            {/* Voting statistics */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <ChartNoAxesColumnIncreasing className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-300">
                  Voting performance
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10">
                    <Vote className="h-4 w-4 text-emerald-300" />
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-white">
                    {voteCount}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Total votes</p>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06]">
                    <Trophy className="h-4 w-4 text-yellow-300" />
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-white">
                    {rank > 0 ? `#${rank}` : "—"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Current position</p>
                </div>

                <div className="col-span-2 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:col-span-1">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06]">
                    <Users className="h-4 w-4 text-blue-300" />
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-white">
                    {voteShare}%
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Share of all votes</p>
                </div>
              </div>
            </section>

            {/* Progress against the leading nominee */}
            <section className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.045] p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Performance against the leader
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Your votes compared with the highest vote count
                  </p>
                </div>

                <span className="text-lg font-bold tabular-nums text-emerald-300">
                  {progress}%
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-black/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-300 transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>{voteCount} votes received</span>
                <span>{leadingVotes} leading votes</span>
              </div>
            </section>

 
            {/* Manifesto */}
            {nominee.manifesto?.trim() && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-300">
                    Manifesto
                  </h2>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-gray-300">
                    {nominee.manifesto}
                  </p>
                </div>
              </section>
            )}

            {/* Achievements */}
            {(nominee.achievements?.length ?? 0) > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-300">
                    Achievements
                  </h2>
                </div>

                <div className="space-y-3">
                  {nominee.achievements?.map((achievement, index) => (
                    <div
                      key={achievement.id ?? `${achievement.project}-${index}`}
                      className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
                        <Award className="h-4 w-4 text-emerald-300" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-200">
                          {achievement.project || "Achievement"}
                        </p>

                        {achievement.created_at && (
                          <p className="mt-1 text-xs text-gray-500">
                            {formatDate(achievement.created_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Voter comments: deliberately do not render voter names */}
            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-300">
                    Voter comments
                  </h2>
                </div>

                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gray-400">
                  {comments.length} comments
                </span>
              </div>

              {comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment, index) => (
                    <div
                      key={`${nominee.id}-comment-${index}`}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Voter feedback
                        </span>
                      </div>

                      <p className="whitespace-pre-wrap text-sm leading-6 text-gray-300">
                        {comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-center">
                  <MessageCircle className="mx-auto mb-3 h-6 w-6 text-gray-600" />
                  <p className="text-sm font-medium text-gray-400">
                    No comments yet
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    Voter comments will appear here when they are available.
                  </p>
                </div>
              )}
            </section>

            {/* Footer summary */}
            <div className="border-t border-white/[0.07] pt-6 text-center">
              <p className="text-xs leading-6 text-gray-500">
                Voting performance is based on the votes currently available
                for nominees in this project.
              </p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-500/70">
                VoteSphere
              </p>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
