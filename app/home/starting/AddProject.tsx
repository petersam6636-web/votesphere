
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase-client";
import useApp from "@/lib/useApp";

import ProjectLoading from "@/components/ProjectLoading";

type DurationUnit = "minutes" | "hours" | "days" | "weeks";

type DurationPreset = {
  label: string;
  description: string;
  value: number;
  unit: DurationUnit;
};

const durationMultipliers: Record<DurationUnit, number> = {
  minutes: 60 * 1000,
  hours: 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
  weeks: 7 * 24 * 60 * 60 * 1000,
};

const durationPresets: DurationPreset[] = [
  {
    label: "24 hours",
    description: "Quick election",
    value: 24,
    unit: "hours",
  },
  {
    label: "3 days",
    description: "Recommended",
    value: 3,
    unit: "days",
  },
  {
    label: "7 days",
    description: "More time to participate",
    value: 7,
    unit: "days",
  },
  {
    label: "14 days",
    description: "Extended election",
    value: 14,
    unit: "days",
  },
];

export default function CreateProjectPage() {
  const router = useRouter();

  const {
    userInfo,
    setUserInfo,
    setProjectDetails,
    setCurrentProject,
    setProject,
    setTaskKey,
  } = useApp();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Three days is the default election duration.
  const [durationMode, setDurationMode] = useState<"preset" | "custom">(
    "preset"
  );

  const [selectedPreset, setSelectedPreset] = useState("3 days");

  const [duration, setDuration] = useState("3");
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

  const getDurationInMilliseconds = () => {
    if (durationMode === "preset") {
      const preset = durationPresets.find(
        (item) => item.label === selectedPreset
      );

      if (!preset) {
        throw new Error("Please select a valid election duration.");
      }

      return preset.value * durationMultipliers[preset.unit];
    }

    const durationNumber = Number(duration);

    if (
      !Number.isFinite(durationNumber) ||
      durationNumber <= 0
    ) {
      throw new Error("Please enter a valid custom duration.");
    }

    return durationNumber * durationMultipliers[unit];
  };

  const handleCreateProject = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!userInfo) {
      setError("Your account could not be verified. Please sign in again.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter a project name.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const durationMs =
        Date.now() + getDurationInMilliseconds();

      const projectDetails = {
        name: name.trim(),
        description: description.trim() || null,
        duration_ms: durationMs,
      };

      // STEP 1: Create the project.
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

      // STEP 2: Find this user's inactive tasks and activate them.
      const { error: taskError } = await supabase
        .from("tasks")
        .update({ key: true })
        .eq("user_id", userInfo)
        .eq("key", false);

      if (taskError) {
        // Best-effort cleanup if task activation fails.
        await supabase
          .from("projects")
          .delete()
          .eq("id", data.id)
          .eq("user_id", userInfo);

        throw new Error(
          `Your project could not finish setting up because task activation failed: ${taskError.message}`
        );
      }

      // STEP 3: Update shared application state.
      setProjectDetails(projectDetails);
      setCurrentProject(data);
      setTaskKey(true);

      setProject((previous) => [
        ...(previous ?? []),
        {
          ...data,
          nominees: [],
        },
      ]);

      // STEP 4: Continue to nominee registration.
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

          <div className="space-y-6">
            {/* Project name */}
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

            {/* Description */}
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

            {/* Election duration */}
            <div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-white/80">
                  Election duration
                </label>

                <p className="mt-1 text-xs text-white/40">
                  Choose how long participants will have to vote.
                </p>
              </div>

              {/* Duration presets */}
              <div className="grid grid-cols-2 gap-3">
                {durationPresets.map((preset) => {
                  const selected =
                    durationMode === "preset" &&
                    selectedPreset === preset.label;

                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setDurationMode("preset");
                        setSelectedPreset(preset.label);
                      }}
                      className={`rounded-xl border p-4 text-left transition ${
                        selected
                          ? "border-emerald-400/70 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.08)]"
                          : "border-emerald-400/15 bg-black/20 hover:border-emerald-400/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white">
                          {preset.label}
                        </span>

                        <span
                          className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                            selected
                              ? "border-emerald-400"
                              : "border-white/30"
                          }`}
                        >
                          {selected && (
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          )}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-white/40">
                        {preset.description}
                      </p>

                      {preset.label === "3 days" && (
                        <span className="mt-2 inline-block text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                          Popular choice
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom duration option */}
              <button
                type="button"
                onClick={() => setDurationMode("custom")}
                className={`mt-3 flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                  durationMode === "custom"
                    ? "border-emerald-400/70 bg-emerald-500/10"
                    : "border-emerald-400/15 bg-black/20 hover:border-emerald-400/40"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    Custom duration
                  </p>

                  <p className="mt-1 text-xs text-white/40">
                    Set your own election time.
                  </p>
                </div>

                <span
                  className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                    durationMode === "custom"
                      ? "border-emerald-400"
                      : "border-white/30"
                  }`}
                >
                  {durationMode === "custom" && (
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  )}
                </span>
              </button>

              {/* Custom duration inputs */}
              {durationMode === "custom" && (
                <div className="mt-3 grid grid-cols-[1fr_1fr] gap-3 rounded-xl border border-emerald-400/15 bg-black/20 p-4">
                  <div>
                    <label
                      htmlFor="custom-duration"
                      className="mb-2 block text-xs font-medium text-white/60"
                    >
                      Amount
                    </label>

                    <input
                      id="custom-duration"
                      type="number"
                      min="1"
                      step="1"
                      value={duration}
                      onChange={(event) =>
                        setDuration(event.target.value)
                      }
                      required={durationMode === "custom"}
                      className="min-w-0 w-full rounded-lg border border-emerald-400/15 bg-black/30 px-3 py-3 text-sm outline-none focus:border-emerald-400/60"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="custom-unit"
                      className="mb-2 block text-xs font-medium text-white/60"
                    >
                      Unit
                    </label>

                    <select
                      id="custom-unit"
                      value={unit}
                      onChange={(event) =>
                        setUnit(event.target.value as DurationUnit)
                      }
                      className="min-w-0 w-full rounded-lg border border-emerald-400/15 bg-[#102019] px-3 py-3 text-sm outline-none focus:border-emerald-400/60"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                    </select>
                  </div>
                </div>
              )}

              <p className="mt-3 text-xs leading-5 text-white/35">
                Your election will automatically reach its scheduled
                expiration time. Choose a duration that gives participants
                enough time to take part.
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          {/* Submit */}
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
