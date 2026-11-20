"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase-client";
import useApp from "@/lib/useApp";

import ProjectLoading from "@/components/ProjectLoading";

type DurationUnit = "minutes" | "hours" | "days" | "years";

const durationMultipliers: Record<DurationUnit, number> = {
  minutes: 60 * 1000,
  hours: 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
  years: 365 * 24 * 60 * 60 * 1000,
};

export default function CreateProjectPage() {
  const router = useRouter();

  const {
    userInfo,
    setUserInfo,
    setProjectDetails,
    setCurrentProject,
    setProject,
  } = useApp();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("1");
  const [unit, setUnit] = useState<DurationUnit>("days");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const verifyUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) throw error;

        if (!data.user) {
          router.replace("/");
          return;
        }

        if (!active) return;

        setUserInfo(data.user.id);
      } catch (err: unknown) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to verify your account."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void verifyUser();

    return () => {
      active = false;
    };
  }, [router, setUserInfo]);

  const handleCreateProject = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!userInfo) {
      setError("Your account could not be verified. Please sign in again.");
      return;
    }

    const durationNumber = Number(duration);

    if (!name.trim()) {
      setError("Please enter a project name.");
      return;
    }

    if (!Number.isFinite(durationNumber) || durationNumber <= 0) {
      setError("Please enter a valid project duration.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const durationMs =
        Date.now() + durationNumber * durationMultipliers[unit];

      const projectDetails = {
        name: name.trim(),
        description: description.trim() || null,
        duration_ms: durationMs,
      };

      const { data, error: insertError } = await supabase
        .from("projects")
        .insert({
          user_id: userInfo,
          name: projectDetails.name,
          description: projectDetails.description,
          duration_ms: projectDetails.duration_ms,
          deleted: false,
        })
        .select("*")
        .single();

      if (insertError) throw insertError;

      setProjectDetails(projectDetails);
      setCurrentProject(data);

      // Keep the shared project list in sync.
      setProject((previous) => [
        ...(previous ?? []),
        {
          ...data,
          nominees: [],
        },
      ]);

      router.push("/register");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your project."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ProjectLoading />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06110d] px-4 py-10 text-white">
      {/* Ambient emerald background */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-green-500/10 blur-[130px]" />

      <div className="relative mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
        <form
          onSubmit={handleCreateProject}
          className="w-full rounded-3xl border border-emerald-400/15 bg-[#0b1913]/90 p-6 shadow-[0_0_70px_rgba(16,185,129,0.06)] backdrop-blur-xl sm:p-9"
        >
          <div className="mb-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
              Project setup · Step 1
            </p>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Create your election
            </h1>

            <p className="mt-2 text-sm leading-6 text-white/50">
              Set up your project before adding the people who will
              participate in the election.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="project-name"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                Project name
              </label>

              <input
                id="project-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Student Representative Election"
                required
                className="w-full rounded-xl border border-emerald-400/15 bg-black/20 px-4 py-3 text-sm outline-none transition placeholder:text-white/25 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
              />
            </div>

            <div>
              <label
                htmlFor="project-description"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                Description
                <span className="ml-2 text-xs text-white/35">
                  Optional
                </span>
              </label>

              <textarea
                id="project-description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Describe what this election is about..."
                rows={4}
                className="w-full resize-none rounded-xl border border-emerald-400/15 bg-black/20 px-4 py-3 text-sm outline-none transition placeholder:text-white/25 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Election duration
              </label>

              <div className="grid grid-cols-[1fr_1fr] gap-3">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  required
                  className="min-w-0 rounded-xl border border-emerald-400/15 bg-black/20 px-4 py-3 text-sm outline-none focus:border-emerald-400/60"
                />

                <select
                  value={unit}
                  onChange={(event) =>
                    setUnit(event.target.value as DurationUnit)
                  }
                  className="min-w-0 rounded-xl border border-emerald-400/15 bg-[#102019] px-4 py-3 text-sm outline-none focus:border-emerald-400/60"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                  <option value="years">Years</option>
                </select>
              </div>

              <p className="mt-2 text-xs text-white/35">
                The election expiration time is calculated from when
                you create this project.
              </p>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving || !userInfo}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-semibold text-[#04100a] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Creating project..." : "Continue to nominees"}
            {!saving && <span aria-hidden="true">→</span>}
          </button>
        </form>
      </div>
    </main>
  );
}