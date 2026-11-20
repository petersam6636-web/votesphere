
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
    label: "30 minutes",
    description: "Quick election",
    value: 30,
    unit: "minutes",
  },
  {
    label: "1 hour",
    description: "Recommended",
    value: 1,
    unit: "hours",
  },
  {
    label: "12 hours",
    description: "More time to participate",
    value: 12,
    unit: "hours",
  },
  {
    label: "1 day",
    description: "Extended election",
    value: 1,
    unit: "days",
  },
  {
    label: "3 days",
    description: "Popular choice",
    value: 3,
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

  const [durationMode, setDurationMode] = useState<"preset" | "custom">(
    "preset"
  );

  const [selectedPreset, setSelectedPreset] = useState("3 days");

  const [duration, setDuration] = useState("3");
  const [unit, setUnit] = useState<DurationUnit>("days");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Verify authenticated user.
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

  // Calculate election duration.
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

    if (!Number.isFinite(durationNumber) || durationNumber <= 0) {
      throw new Error("Please enter a valid custom duration.");
    }

    return durationNumber * durationMultipliers[unit];
  };

  // Create project.
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
      const durationMs = Date.now() + getDurationInMilliseconds();

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

      // STEP 2: Activate inactive tasks.
      const { error: taskError } = await supabase
        .from("tasks")
        .update({ key: true })
        .eq("user_id", userInfo)
        .eq("key", false);

      if (taskError) {
        // Clean up project if task activation fails.
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
    <main className="relative min-h-screen overflow-hidden px-4 py-3 text-white">

      {/* Ambient emerald background */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-green-500/10 blur-[130px]" />

      <div className="relative mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">

        {/* Main Card */}
        <form
          onSubmit={handleCreateProject}
          className="w-full max-w-xl rounded-2xl border border-emerald-400/15 bg-[#0b1913]/90 p-5 shadow-[0_0_60px_rgba(16,185,129,0.06)] backdrop-blur-xl sm:p-6"
        >

          {/* Header */}
          <div className="mb-5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-400">
              Project setup · Step 1
            </p>

            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Create your election
            </h1>

            <p className="mt-1.5 text-xs leading-5 text-white/50">
              Set up your project before adding the people who will
              participate in the election.
            </p>
          </div>

          <div className="space-y-4">

            {/* Project Name */}
            <div>
              <label
                htmlFor="project-name"
                className="mb-1.5 block text-xs font-medium text-white/80"
              >
                Project name
              </label>

              <input
                id="project-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Student Representative Election"
                required
                className="w-full rounded-lg border border-emerald-400/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10 [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[box-shadow:0_0_0px_1000px_#0b1913_inset]"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="project-description"
                className="mb-1.5 block text-xs font-medium text-white/80"
              >
                Description

                <span className="ml-2 text-[10px] text-white/35">
                  Optional
                </span>
              </label>

              <textarea
                id="project-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe what this election is about..."
                rows={3}
                className="w-full resize-none rounded-lg border border-emerald-400/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10 [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[box-shadow:0_0_0px_1000px_#0b1913_inset]"
              />
            </div>

            {/* Election Duration */}
            <div>
              <div className="mb-2.5">
                <label className="block text-xs font-medium text-white/80">
                  Election duration
                </label>

                <p className="mt-1 text-[11px] text-white/40">
                  Choose how long participants will have to vote.
                </p>
              </div>

              {/* Duration Presets */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                      className={`rounded-lg border p-3 text-left transition ${
                        selected
                          ? "border-emerald-400/70 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.08)]"
                          : "border-emerald-400/15 bg-black/20 hover:border-emerald-400/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-white">
                          {preset.label}
                        </span>

                        <span
                          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                            selected
                              ? "border-emerald-400"
                              : "border-white/30"
                          }`}
                        >
                          {selected && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          )}
                        </span>
                      </div>

                      <p className="mt-1.5 text-[10px] leading-4 text-white/40">
                        {preset.description}
                      </p>

                      {preset.label === "3 days" && (
                        <span className="mt-1.5 inline-block text-[9px] font-semibold uppercase tracking-wider text-emerald-400">
                          Popular choice
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom Duration */}
              <button
                type="button"
                onClick={() => setDurationMode("custom")}
                className={`mt-2 flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${
                  durationMode === "custom"
                    ? "border-emerald-400/70 bg-emerald-500/10"
                    : "border-emerald-400/15 bg-black/20 hover:border-emerald-400/40"
                }`}
              >
                <div>
                  <p className="text-xs font-semibold text-white">
                    Custom duration
                  </p>

                  <p className="mt-1 text-[10px] text-white/40">
                    Set your own election time.
                  </p>
                </div>

                <span
                  className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
                    durationMode === "custom"
                      ? "border-emerald-400"
                      : "border-white/30"
                  }`}
                >
                  {durationMode === "custom" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  )}
                </span>
              </button>

              {/* Custom Duration Inputs */}
              {durationMode === "custom" && (
                <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-emerald-400/15 bg-black/20 p-3">
                  <div>
                    <label
                      htmlFor="custom-duration"
                      className="mb-1.5 block text-[11px] font-medium text-white/60"
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
                      className="w-full min-w-0 rounded-lg border border-emerald-400/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/60"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="custom-unit"
                      className="mb-1.5 block text-[11px] font-medium text-white/60"
                    >
                      Unit
                    </label>

                    <select
                      id="custom-unit"
                      value={unit}
                      onChange={(event) =>
                        setUnit(event.target.value as DurationUnit)
                      }
                      className="w-full min-w-0 rounded-lg border border-emerald-400/15 bg-[#102019] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/60"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                    </select>
                  </div>
                </div>
              )}

              <p className="mt-2 text-[10px] leading-4 text-white/35">
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
              className="mt-4 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-300"
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || !userInfo}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-xs font-semibold text-[#04100a] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Creating project..." : "Continue to nominees"}

            {!saving && <span aria-hidden="true">→</span>}
          </button>
        </form>
      </div>
    </main>
  );
}
