
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Info,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Users,
  Vote,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase-client";
import useApp from "@/lib/useApp";
import type { Nominee, Project } from "@/types/project";

type VoteForm = {
  name: string;
  comment: string;
};

const getVoteStorageKey = (projectId: string | number) =>
  `votesphere-voted-${projectId}`;

async function getAuthenticatedUserId() {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;
  if (!data.user) {
    throw new Error("Please sign in again before voting.");
  }

  return data.user.id;
}

function syncLocalVoteMarker(projectId: string | number, hasVoted: boolean) {
  try {
    const storageKey = getVoteStorageKey(projectId);

    if (hasVoted) {
      localStorage.setItem(storageKey, "voted");
    } else {
      localStorage.removeItem(storageKey);
    }
  } catch (error) {
    console.warn("Unable to synchronize the local vote marker:", error);
  }
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

export default function NomineesPage() {
  const router = useRouter();

  const { taskKey, project, setProject } = useApp();

  const [currentProject, setCurrentProject] =
    useState<Project | null>(null);

  const [loadingProject, setLoadingProject] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedNominee, setSelectedNominee] =
    useState<Nominee | null>(null);

  const [voteForm, setVoteForm] = useState<VoteForm>({
    name: "",
    comment: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteError, setVoteError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showAlreadyVoted, setShowAlreadyVoted] = useState(false);

  // Select the earliest-created project.
  const selectedProject = useMemo(() => {
    const allProjects = project ?? [];

    if (allProjects.length === 0) return null;

    return [...allProjects].sort((a, b) => {
      const dateA = a.created_at
        ? new Date(a.created_at).getTime()
        : Number.POSITIVE_INFINITY;

      const dateB = b.created_at
        ? new Date(b.created_at).getTime()
        : Number.POSITIVE_INFINITY;

      return dateA - dateB;
    })[0];
  }, [project]);

  // Fetch the latest election and its nominees.
  const refreshProject = useCallback(
    async (projectId: string | number) => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          nominees (
            *,
            achievements (*),
            voters (*)
          )
        `)
        .eq("id", projectId)
        .eq("deleted", false)
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error("Unable to find the current election.");
      }

      const updatedProject = data as Project;

      setCurrentProject(updatedProject);

      setProject((previousProjects) => {
        if (!previousProjects) {
          return [updatedProject];
        }

        return previousProjects.map((item) =>
          item.id === updatedProject.id
            ? updatedProject
            : item
        );
      });

      return updatedProject;
    },
    [setProject]
  );

  // Database records are authoritative; local storage is only a cache.
  const checkVotingStatus = useCallback(
    async (projectId: string | number, userId?: string) => {
      const voterUserId = userId ?? (await getAuthenticatedUserId());
      const { data, error } = await supabase
        .from("voters")
        .select("project_id")
        .eq("user_id", voterUserId);

      if (error) throw error;

      const voted = (data ?? []).some(
        (voter) => String(voter.project_id) === String(projectId)
      );

      syncLocalVoteMarker(projectId, voted);
      setHasVoted(voted);

      return voted;
    },
    []
  );

  // Load project and subscribe to realtime updates.
  useEffect(() => {
    if (taskKey !== true || !selectedProject?.id) {
      setLoadingProject(false);
      setCurrentProject(null);
      return;
    }

    let active = true;

    const loadProject = async () => {
      setLoadingProject(true);
      setLoadError("");

      try {
        const updated = await refreshProject(selectedProject.id);

        if (active) {
          await checkVotingStatus(updated.id);
        }
      } catch (error: unknown) {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load the election."
          );
        }
      } finally {
        if (active) setLoadingProject(false);
      }
    };

    void loadProject();

    const channel = supabase
      .channel(`nominee-votes-${selectedProject.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "voters",
        },
        () => {
          void refreshProject(selectedProject.id).catch((error) => {
            console.error("Unable to refresh nominee results:", error);
          });
        }
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [
    taskKey,
    selectedProject?.id,
    refreshProject,
    checkVotingStatus,
  ]);

  // Automatically hide success notification.
  useEffect(() => {
    if (!successMessage) return;

    const timeout = window.setTimeout(() => {
      setSuccessMessage("");
    }, 4500);

    return () => window.clearTimeout(timeout);
  }, [successMessage]);

// Sort nominees by highest vote count first.
const nominees = useMemo(() => {
  return [...(currentProject?.nominees ?? [])].sort((a, b) => {
    const votesA = a.voters?.length ?? 0;
    const votesB = b.voters?.length ?? 0;

    return votesB - votesA;
  });
}, [currentProject?.nominees]);
  const totalVotes = nominees.reduce(
    (total, nominee) => total + (nominee.voters?.length ?? 0),
    0
  );

  // Open voting modal.
  const openVoteModal = async (nominee: Nominee) => {
    if (!currentProject?.id) return;

    setVoteError("");

    let alreadyVoted: boolean;
    try {
      alreadyVoted = await checkVotingStatus(currentProject.id);
    } catch (error: unknown) {
      console.error("Unable to verify voting eligibility:", error);
      setVoteError(
        "We couldn't verify whether you have already voted. Please try again."
      );
      return;
    }

    if (alreadyVoted) {
      setShowAlreadyVoted(true);
      return;
    }

    setSelectedNominee(nominee);
    setVoteForm({ name: "", comment: "" });
  };

  const closeVoteModal = () => {
    if (submitting) return;

    setSelectedNominee(null);
    setVoteError("");
    setVoteForm({ name: "", comment: "" });
  };

  // Submit vote.
  const handleVote = async () => {
    if (!selectedNominee || !currentProject?.id || submitting) return;

    const name = voteForm.name.trim();
    const comment = voteForm.comment.trim();

    if (!name) {
      setVoteError("Please enter your name before voting.");
      return;
    }

    setSubmitting(true);
    setVoteError("");

    try {
      const userId = await getAuthenticatedUserId();

      // Recheck immediately before inserting.
      const alreadyVoted = await checkVotingStatus(currentProject.id, userId);

      if (alreadyVoted) {
        setShowAlreadyVoted(true);
        setSelectedNominee(null);
        return;
      }

      const { error } = await supabase.from("voters").insert({
        project_id: currentProject.id,
        nominee_id: selectedNominee.id,
        user_id: userId,
        name,
        comment: comment || null,
      });

      if (error) throw error;

      syncLocalVoteMarker(currentProject.id, true);

      setHasVoted(true);

      const nomineeName =
        selectedNominee.name || "your selected nominee";

      setSelectedNominee(null);
      setVoteForm({ name: "", comment: "" });

      setSuccessMessage(
        `Thank you, ${name}! Your vote for ${nomineeName} was submitted successfully.`
      );

      try {
        await refreshProject(currentProject.id);
        setLoadError("");
      } catch (refreshError: unknown) {
        console.error(
          "Vote was saved, but the project could not be refreshed:",
          refreshError
        );

        setLoadError(
          "Your vote was submitted successfully, but the latest results could not be loaded. Please refresh the page."
        );
      }
    } catch (error: unknown) {
      setVoteError(
        error instanceof Error
          ? error.message
          : "Your vote could not be submitted. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartElection = () => {
    router.push("/home/starting");
  };

  const handleDetails = (nomineeId: string) => {
    router.push(`/home/share/${nomineeId}`);
  };

  // Loading shared application state.
  if (taskKey === null || project === null) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-white/45">
          <Loader2 size={19} className="animate-spin text-emerald-400" />
          Preparing your election...
        </div>
      </div>
    );
  }

  // No active election: centered without unnecessary scrolling.
  if (!(taskKey === true && project.length > 0)) {
    return (
      <div className="flex min-h-[calc(100dvh-5rem)] w-full items-center justify-center overflow-hidden px-4 py-4">
        <section className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0b1510] p-7 text-center shadow-[0_25px_80px_rgba(0,0,0,0.35)] sm:p-9">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-400/[0.08] blur-[65px]" />

          <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300">
            <Vote size={29} />
          </div>

          <h2 className="text-xl font-semibold tracking-tight text-white">
            No election to vote for
          </h2>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/45">
            There is currently no active election in your workspace. Start an
            election to invite nominees and begin collecting votes.
          </p>

          <button
            type="button"
            onClick={handleStartElection}
            className="group mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3.5 text-sm font-semibold text-[#04130c] shadow-[0_8px_25px_rgba(16,185,129,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-300 active:translate-y-0"
          >
            <Vote size={17} />
            Start Election
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </button>
        </section>
      </div>
    );
  }

  if (loadingProject) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-white/45">
          <Loader2 size={19} className="animate-spin text-emerald-400" />
          Loading election and nominees...
        </div>
      </div>
    );
  }

  if (loadError && !currentProject) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <Info className="mx-auto mb-3 text-red-300" size={25} />
          <p className="text-sm text-red-300">{loadError}</p>

          <button
            type="button"
            onClick={() => {
              if (!selectedProject?.id) return;

              setLoadingProject(true);
              setLoadError("");

              void refreshProject(selectedProject.id)
                .then((updated) => checkVotingStatus(updated.id))
                .catch((error: unknown) => {
                  setLoadError(
                    error instanceof Error
                      ? error.message
                      : "Unable to reload the election."
                  );
                })
                .finally(() => setLoadingProject(false));
            }}
            className="mt-4 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/[0.06]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!currentProject) return null;

  return (
    <main className="relative min-h-screen overflow-hidden px-2 py-4 text-white lg:px-6">
      {/* Ambient background */}
      <div className="pointer-events-none absolute left-1/4 top-0 h-72 w-72 rounded-full bg-emerald-500/[0.035] blur-[100px]" />
      <div className="pointer-events-none absolute bottom-20 right-0 h-64 w-64 rounded-full bg-emerald-400/[0.035] blur-[100px]" />

      <div className="relative mx-auto w-full max-w-7xl">
        {/* Header */}
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-white/[0.07] pb-6 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-emerald-300/65">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Live election
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {currentProject.name || "Untitled election"}
            </h1>

            <p className="mt-2 text-sm text-white/40">
              {currentProject.description ||
                "View the nominees and cast your vote."}
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] px-3.5 py-2.5 text-xs font-medium text-emerald-300">
            <CheckCircle2 size={15} />
            Voting active
          </div>
        </header>

        {/* Election information */}
        <section className="mb-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">Nominees</span>
              <Users size={17} className="text-emerald-300" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">
              {nominees.length}
            </p>
            <p className="mt-1 text-xs text-white/30">
              Candidates in this election
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">Total votes</span>
              <Vote size={17} className="text-emerald-300" />
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
              {totalVotes.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-white/30">
              Votes submitted so far
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">Created</span>
              <Clock3 size={17} className="text-emerald-300" />
            </div>
            <p className="mt-2 text-base font-semibold text-white">
              {formatDate(currentProject.created_at)}
            </p>
            <p className="mt-1 text-xs text-white/30">
              Election creation date
            </p>
          </div>
        </section>

        {/* Refresh error */}
        {loadError && (
          <div
            role="alert"
            className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-amber-400/15 bg-amber-400/[0.05] p-3 text-xs text-amber-200"
          >
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => {
                setLoadError("");
                void refreshProject(currentProject.id).catch(
                  (error: unknown) => {
                    setLoadError(
                      error instanceof Error
                        ? error.message
                        : "Unable to refresh the election."
                    );
                  }
                );
              }}
              className="shrink-0 underline underline-offset-2"
            >
              Refresh
            </button>
          </div>
        )}

        {/* Voting status */}
        {hasVoted && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.055] p-4">
            <ShieldCheck
              size={19}
              className="mt-0.5 shrink-0 text-emerald-300"
            />
            <div>
              <p className="text-sm font-semibold text-emerald-200">
                Your vote has been recorded
              </p>
              <p className="mt-1 text-xs leading-5 text-white/40">
                This browser has already submitted a vote for this election.
                You cannot vote again from this browser.
              </p>
            </div>
          </div>
        )}

        {/* Nominee heading */}
        <section className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/30">
              Election participants
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              Meet the nominees
            </h2>
            <p className="mt-1 text-sm text-white/40">
              Review each nominee and choose who deserves your vote.
            </p>
          </div>

          <span className="rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-xs text-white/45">
            {nominees.length}{" "}
            {nominees.length === 1 ? "nominee" : "nominees"}
          </span>
        </section>

        {/* Nominee cards */}
        {nominees.length === 0 ? (
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] px-5 py-14 text-center">
            <Users className="mx-auto mb-4 text-white/30" size={30} />
            <h3 className="font-semibold text-white">
              No nominees available
            </h3>
            <p className="mt-2 text-sm text-white/40">
              Nominees will appear here when they are added to this election.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {nominees.map((nominee) => {
              const voteCount = nominee.voters?.length ?? 0;

              const percentage =
                totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

              return (
                <article
                  key={nominee.id}
                  className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0b1510]/90 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/20 hover:shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:p-6"
                >
                  <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-emerald-400/[0.035] blur-[65px] transition group-hover:bg-emerald-400/[0.07]" />

                  <div className="relative">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-300">
                        <Users size={22} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-lg font-semibold text-white">
                          {nominee.name || "Unnamed nominee"}
                        </h3>
                        <p className="mt-1 text-xs text-white/35">
                          Election nominee
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-right">
                        <p className="text-lg font-semibold tabular-nums text-white">
                          {voteCount.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-white/35">
                          {voteCount === 1 ? "vote" : "votes"}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mt-5">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300/55">
                        Description
                      </p>
                      <p className="min-h-[48px] whitespace-pre-wrap break-words text-sm leading-6 text-white/50">
                        {nominee.manifesto ||
                          "This nominee has not provided a description yet."}
                      </p>
                    </div>

                    {/* Vote progress */}
                    <div className="mt-6">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-xs text-white/40">
                          Vote distribution
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-emerald-300">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>

                      <div
                        className="h-2 overflow-hidden rounded-full bg-white/[0.07]"
                        role="progressbar"
                        aria-label={`${nominee.name || "Nominee"} vote percentage`}
                        aria-valuenow={Number(percentage.toFixed(1))}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-300 transition-all duration-700 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => handleDetails(nominee.id)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.035] px-4 py-3 text-sm font-medium text-white/75 transition-all duration-300 hover:border-emerald-400/25 hover:bg-emerald-400/[0.07] hover:text-emerald-300"
                      >
                        <Info size={16} />
                        View details
                        <ArrowRight size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => void openVoteModal(nominee)}
                        disabled={hasVoted}
                        className="group/button inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-[#04130c] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-300 hover:shadow-[0_8px_25px_rgba(16,185,129,0.15)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Vote size={16} />
                        {hasVoted ? "Already voted" : "Vote for nominee"}
                        {!hasVoted && (
                          <ArrowRight
                            size={15}
                            className="transition-transform group-hover/button:translate-x-1"
                          />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <footer className="mt-10 border-t border-white/[0.06] py-6 text-center text-xs text-white/25">
          VoteSphere · Your voice, your decision.
        </footer>
      </div>

      {/* Success notification */}
      {successMessage && (
        <div
          role="status"
          className="fixed right-4 top-5 z-[120] flex w-[calc(100%-32px)] max-w-sm items-start gap-3 rounded-2xl border border-emerald-400/20 bg-[#10251a]/95 p-4 shadow-[0_15px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
            <CheckCircle2 size={19} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-200">
              Vote submitted successfully!
            </p>
            <p className="mt-1 text-xs leading-5 text-white/55">
              {successMessage}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Dismiss notification"
            className="rounded-lg p-1 text-white/40 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Already voted popup */}
      {showAlreadyVoted && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/[0.1] bg-[#0c1711] p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300">
              <ShieldCheck size={26} />
            </div>

            <h3 className="text-lg font-semibold text-white">
              Vote already submitted
            </h3>

            <p className="mt-2 text-sm leading-6 text-white/45">
              A vote has already been recorded from this browser for this
              election. You cannot vote again.
            </p>

            <button
              type="button"
              onClick={() => setShowAlreadyVoted(false)}
              className="mt-6 w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-[#04130c] transition hover:bg-emerald-300"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Voting modal */}
      {selectedNominee && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeVoteModal();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="vote-modal-title"
            className="relative my-auto w-full max-w-md overflow-hidden rounded-3xl border border-emerald-400/15 bg-[#0c1711] p-6 shadow-[0_25px_100px_rgba(0,0,0,0.6)] sm:p-7"
          >
            <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-400/[0.07] blur-[65px]" />

            <div className="relative">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300">
                    <Vote size={21} />
                  </div>

                  <h2
                    id="vote-modal-title"
                    className="text-xl font-semibold text-white"
                  >
                    Cast your vote
                  </h2>

                  <p className="mt-1 text-sm text-white/40">
                    You are voting for:
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeVoteModal}
                  disabled={submitting}
                  aria-label="Close voting dialog"
                  className="rounded-xl p-2 text-white/40 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="mb-6 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.055] p-4">
                <p className="font-semibold text-emerald-200">
                  {selectedNominee.name || "Unnamed nominee"}
                </p>
                <p className="mt-1 text-xs leading-5 text-white/40">
                  Your vote will be recorded for this nominee.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="voter-name"
                    className="mb-2 block text-xs font-medium text-white/65"
                  >
                    Your name <span className="text-emerald-300">*</span>
                  </label>

                  <input
                    id="voter-name"
                    type="text"
                    autoComplete="name"
                    maxLength={100}
                    value={voteForm.name}
                    onChange={(event) =>
                      setVoteForm((previous) => ({
                        ...previous,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Enter your name"
                    disabled={submitting}
                    className="w-full rounded-xl border border-white/[0.09] bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/45 focus:ring-2 focus:ring-emerald-400/10 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="voter-comment"
                    className="mb-2 flex items-center gap-2 text-xs font-medium text-white/65"
                  >
                    <MessageSquare size={13} />
                    Comment
                    <span className="text-white/30">(optional)</span>
                  </label>

                  <textarea
                    id="voter-comment"
                    rows={3}
                    maxLength={500}
                    value={voteForm.comment}
                    onChange={(event) =>
                      setVoteForm((previous) => ({
                        ...previous,
                        comment: event.target.value,
                      }))
                    }
                    placeholder="Share a short comment..."
                    disabled={submitting}
                    className="w-full resize-none rounded-xl border border-white/[0.09] bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/45 focus:ring-2 focus:ring-emerald-400/10 disabled:opacity-50"
                  />

                  <p className="mt-1 text-right text-[10px] text-white/25">
                    {voteForm.comment.length}/500
                  </p>
                </div>
              </div>

              {voteError && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-red-400/15 bg-red-400/[0.06] px-3 py-2.5 text-xs leading-5 text-red-300"
                >
                  {voteError}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleVote}
                  disabled={submitting || !voteForm.name.trim()}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3.5 text-sm font-semibold text-[#04130c] shadow-[0_8px_25px_rgba(16,185,129,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-300 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Submitting vote...
                    </>
                  ) : (
                    <>
                      <Vote size={17} />
                      Confirm and vote
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={closeVoteModal}
                  disabled={submitting}
                  className="w-full rounded-xl border border-white/[0.08] px-4 py-3 text-sm font-medium text-white/50 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-40"
                >
                  Cancel
                </button>
              </div>

              <p className="mt-5 text-center text-[11px] leading-5 text-white/25">
                Please review your choice carefully. You cannot vote again
                after submitting.
              </p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
