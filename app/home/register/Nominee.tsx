"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase-client";
import useApp from "@/lib/useApp";

import ProjectLoading from "@/components/ProjectLoading";

import type {
  AchievementForm,
  NomineeForm,
  Project,
} from "@/types/project";

const createEmptyNominee = (): NomineeForm => ({
  name: "",
  manifesto: "",
  image: null,
  achievements: [],
});

export default function Nominee() {
  const router = useRouter();

  const {
    userInfo,
    setUserInfo,
    currentProject,
    setCurrentProject,
    setProject,
    setTaskKey,
  } = useApp();

  const [nominees, setNominees] = useState<NomineeForm[]>([
    createEmptyNominee(),
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Verify the user and recover the current project if necessary.
  useEffect(() => {
    let active = true;

    const prepareRegistration = async () => {
      try {
        const { data, error: authError } =
          await supabase.auth.getUser();

        if (authError) throw authError;

        if (!data.user) {
          router.replace("/");
          return;
        }

        if (!active) return;

        setUserInfo(data.user.id);

        if (!currentProject) {
          const { data: savedProject, error: projectError } =
            await supabase
              .from("projects")
              .select("*")
              .eq("user_id", data.user.id)
              .eq("deleted", false)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

          if (projectError) throw projectError;

          if (!savedProject) {
            router.replace("/home/projects/create");
            return;
          }

          if (!active) return;

          setCurrentProject(savedProject as Project);
        } else if (currentProject.user_id !== data.user.id) {
          throw new Error(
            "This project does not belong to your account."
          );
        }
      } catch (err: unknown) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to prepare nominee registration."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void prepareRegistration();

    return () => {
      active = false;
    };
  }, [
    currentProject,
    router,
    setUserInfo,
    setCurrentProject,
  ]);

  const updateNominee = (
    index: number,
    updates: Partial<NomineeForm>
  ) => {
    setNominees((previous) =>
      previous.map((nominee, nomineeIndex) =>
        nomineeIndex === index
          ? { ...nominee, ...updates }
          : nominee
      )
    );
  };

  const addNominee = () => {
    setNominees((previous) => [
      ...previous,
      createEmptyNominee(),
    ]);
  };

  const removeNominee = (index: number) => {
    setNominees((previous) =>
      previous.filter((_, nomineeIndex) => nomineeIndex !== index)
    );
  };

  const addAchievement = (nomineeIndex: number) => {
    setNominees((previous) =>
      previous.map((nominee, index) =>
        index === nomineeIndex
          ? {
              ...nominee,
              achievements: [
                ...nominee.achievements,
                { project: "" },
              ],
            }
          : nominee
      )
    );
  };

  const updateAchievement = (
    nomineeIndex: number,
    achievementIndex: number,
    value: string
  ) => {
    setNominees((previous) =>
      previous.map((nominee, index) => {
        if (index !== nomineeIndex) return nominee;

        return {
          ...nominee,
          achievements: nominee.achievements.map(
            (achievement, itemIndex) =>
              itemIndex === achievementIndex
                ? { ...achievement, project: value }
                : achievement
          ),
        };
      })
    );
  };

  const removeAchievement = (
    nomineeIndex: number,
    achievementIndex: number
  ) => {
    setNominees((previous) =>
      previous.map((nominee, index) =>
        index === nomineeIndex
          ? {
              ...nominee,
              achievements: nominee.achievements.filter(
                (_, itemIndex) => itemIndex !== achievementIndex
              ),
            }
          : nominee
      )
    );
  };

  const uploadNomineeImage = async (
    image: File,
    nomineeIndex: number
  ): Promise<string> => {
    const safeFileName = image.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    const filePath = `${userInfo}/${currentProject!.id}/${Date.now()}-${nomineeIndex}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("nominee_images")
      .upload(filePath, image, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("nominee_images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const refreshProjects = async () => {
    const { data, error: fetchError } = await supabase
      .from("projects")
      .select(`
        *,
        nominees (
          *,
          achievements (*)
        )
      `)
      .eq("user_id", userInfo)
      .eq("deleted", false)
      .order("created_at", { ascending: true });

    if (fetchError) throw fetchError;

    const updatedProjects = (data ?? []) as Project[];

    setProject(updatedProjects);

    const updatedCurrentProject = updatedProjects.find(
      (item) => item.id === currentProject!.id
    );

    if (updatedCurrentProject) {
      setCurrentProject(updatedCurrentProject);
    }
  };

  const activateVoting = async () => {
    if (!userInfo || !currentProject) {
      setError("Your project information is missing. Please try again.");
      return;
    }

    if (nominees.length === 0) {
      setError("Please add at least one nominee.");
      return;
    }

    // Validate all nominee details before saving anything.
    for (let index = 0; index < nominees.length; index++) {
      const nominee = nominees[index];

      if (!nominee.name.trim()) {
        setError(`Please enter a name for nominee ${index + 1}.`);
        return;
      }

      if (!nominee.manifesto.trim()) {
        setError(`Please enter a manifesto for nominee ${index + 1}.`);
        return;
      }

      const hasEmptyAchievement = nominee.achievements.some(
        (achievement) => !achievement.project.trim()
      );

      if (hasEmptyAchievement) {
        setError(
          `Please complete or remove the empty achievement for nominee ${index + 1}.`
        );
        return;
      }
    }

    setSaving(true);
    setError("");

    try {
      // 1. Save every nominee and its achievements.
      for (let index = 0; index < nominees.length; index++) {
        const nominee = nominees[index];

        let imageUrl: string | null = null;

        // Upload the image only when the user selected one.
        if (nominee.image) {
          imageUrl = await uploadNomineeImage(
            nominee.image,
            index
          );
        }

        // 2. Insert the nominee and get its generated ID.
        const { data: savedNominee, error: nomineeError } =
          await supabase
            .from("nominees")
            .insert({
              project_id: currentProject.id,
              user_id: userInfo,
              name: nominee.name.trim(),
              manifesto: nominee.manifesto.trim(),
              image: imageUrl,
            })
            .select("id")
            .single();

        if (nomineeError) throw nomineeError;

        // 3. Insert achievements using the nominee's generated ID.
        const achievements = nominee.achievements
          .filter((item: AchievementForm) => item.project.trim())
          .map((item) => ({
            nominee_id: savedNominee.id,
            project: item.project.trim(),
          }));

        if (achievements.length > 0) {
          const { error: achievementError } = await supabase
            .from("achievements")
            .insert(achievements);

          if (achievementError) throw achievementError;
        }
      }

      // 4. Find one task belonging to this user.
      const { data: task, error: taskFetchError } = await supabase
        .from("tasks")
        .select("id")
        .eq("user_id", userInfo)
        .limit(1)
        .maybeSingle();

      if (taskFetchError) throw taskFetchError;

      // 5. Update the task key, or create a task if none exists.
      if (task) {
        const { error: taskUpdateError } = await supabase
          .from("tasks")
          .update({ key: true })
          .eq("id", task.id);

        if (taskUpdateError) throw taskUpdateError;
      } else {
        const { error: taskInsertError } = await supabase
          .from("tasks")
          .insert({
            user_id: userInfo,
            key: true,
          });

        if (taskInsertError) throw taskInsertError;
      }

      // 6. Refresh all projects with their nominees and achievements.
      await refreshProjects();

      // 7. Update shared state so the homepage responds immediately.
      setTaskKey(true);

      // 8. Return to the homepage.
      router.replace("/home");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete nominee registration."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ProjectLoading />;
  }

  if (!currentProject) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#06110d] px-5 text-center text-white">
        <div>
          <p className="text-sm text-red-300">
            {error || "No project was found for this registration."}
          </p>

          <button
            onClick={() => router.push("/home/projects/create")}
            className="mt-5 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-[#04100a]"
          >
            Create a project
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06110d] px-4 py-10 text-white">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-green-500/10 blur-[130px]" />

      <div className="relative mx-auto max-w-3xl">
        {/* Page heading */}
        <div className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Project setup · Step 2
          </p>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Register your nominees
          </h1>

          <p className="mt-2 text-sm leading-6 text-white/50">
            Add the people participating in this election. You can
            add as many nominees as you need.
          </p>

          <div className="mt-5 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4">
            <p className="text-xs text-emerald-400">
              CURRENT PROJECT
            </p>

            <h2 className="mt-1 font-semibold">
              {currentProject.name}
            </h2>

            {currentProject.description && (
              <p className="mt-1 text-sm text-white/45">
                {currentProject.description}
              </p>
            )}
          </div>
        </div>

        {/* Nominee forms */}
        <div className="space-y-6">
          {nominees.map((nominee, nomineeIndex) => (
            <section
              key={nomineeIndex}
              className="rounded-3xl border border-emerald-400/15 bg-[#0b1913]/90 p-5 shadow-[0_0_50px_rgba(16,185,129,0.04)] backdrop-blur-xl sm:p-7"
            >
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    Nominee {nomineeIndex + 1}
                  </p>

                  <h2 className="mt-1 text-lg font-semibold">
                    Nominee information
                  </h2>
                </div>

                {nominees.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeNominee(nomineeIndex)}
                    className="rounded-lg border border-red-400/20 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="space-y-5">
                <div>
                  <label
                    htmlFor={`nominee-name-${nomineeIndex}`}
                    className="mb-2 block text-sm font-medium text-white/80"
                  >
                    Full name
                  </label>

                  <input
                    id={`nominee-name-${nomineeIndex}`}
                    value={nominee.name}
                    onChange={(event) =>
                      updateNominee(nomineeIndex, {
                        name: event.target.value,
                      })
                    }
                    placeholder="Enter nominee's full name"
                    className="w-full rounded-xl border border-emerald-400/15 bg-black/20 px-4 py-3 text-sm outline-none transition placeholder:text-white/25 focus:border-emerald-400/60"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`nominee-manifesto-${nomineeIndex}`}
                    className="mb-2 block text-sm font-medium text-white/80"
                  >
                    Manifesto
                  </label>

                  <textarea
                    id={`nominee-manifesto-${nomineeIndex}`}
                    value={nominee.manifesto}
                    onChange={(event) =>
                      updateNominee(nomineeIndex, {
                        manifesto: event.target.value,
                      })
                    }
                    rows={4}
                    placeholder="What does this nominee stand for?"
                    className="w-full resize-none rounded-xl border border-emerald-400/15 bg-black/20 px-4 py-3 text-sm outline-none transition placeholder:text-white/25 focus:border-emerald-400/60"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`nominee-image-${nomineeIndex}`}
                    className="mb-2 block text-sm font-medium text-white/80"
                  >
                    Nominee image
                    <span className="ml-2 text-xs text-white/35">
                      Optional
                    </span>
                  </label>

                  <input
                    id={`nominee-image-${nomineeIndex}`}
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      updateNominee(nomineeIndex, {
                        image: event.target.files?.[0] ?? null,
                      })
                    }
                    className="block w-full rounded-xl border border-emerald-400/15 bg-black/20 px-3 py-3 text-sm text-white/60 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-500/15 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-emerald-300"
                  />

                  {nominee.image && (
                    <p className="mt-2 text-xs text-emerald-300">
                      Selected: {nominee.image.name}
                    </p>
                  )}
                </div>

                {/* Achievements */}
                <div className="border-t border-white/10 pt-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">
                        Achievements
                      </h3>

                      <p className="mt-1 text-xs text-white/40">
                        Add achievements for this nominee, if any.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => addAchievement(nomineeIndex)}
                      className="shrink-0 rounded-lg border border-emerald-400/20 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/10"
                    >
                      + Add
                    </button>
                  </div>

                  {nominee.achievements.length === 0 && (
                    <p className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-center text-xs text-white/35">
                      No achievements added. This section is optional.
                    </p>
                  )}

                  <div className="space-y-3">
                    {nominee.achievements.map(
                      (achievement, achievementIndex) => (
                        <div
                          key={achievementIndex}
                          className="flex items-start gap-2"
                        >
                          <textarea
                            value={achievement.project}
                            onChange={(event) =>
                              updateAchievement(
                                nomineeIndex,
                                achievementIndex,
                                event.target.value
                              )
                            }
                            rows={2}
                            placeholder="Describe an achievement..."
                            className="min-w-0 flex-1 resize-none rounded-xl border border-emerald-400/15 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-white/25 focus:border-emerald-400/60"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeAchievement(
                                nomineeIndex,
                                achievementIndex
                              )
                            }
                            aria-label="Remove achievement"
                            className="rounded-lg px-3 py-3 text-sm text-red-300 transition hover:bg-red-500/10"
                          >
                            ✕
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Add nominee */}
        <button
          type="button"
          onClick={addNominee}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-400/30 bg-emerald-400/[0.04] px-5 py-4 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400/60 hover:bg-emerald-400/[0.08]"
        >
          <span className="text-lg">+</span>
          Add another nominee
        </button>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </p>
        )}

        {/* Final action */}
        <div className="mt-8 rounded-2xl border border-emerald-400/15 bg-[#0b1913]/80 p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">
                Ready to apply?
              </p>

              <p className="mt-1 text-xs text-white/40">
                {nominees.length} nominee
                {nominees.length === 1 ? "" : "s"} added
              </p>
            </div>

            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              Step 2 of 2
            </span>
          </div>

          <button
            type="button"
            onClick={activateVoting}
            disabled={saving || loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-4 text-sm font-bold text-[#04100a] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#04100a]/30 border-t-[#04100a]" />
                Saving nominees...
              </>
            ) : (
              <>
                Apply for voting
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>

          <p className="mt-3 text-center text-xs text-white/35">
            Your nominees and achievements will be saved before
            voting is activated.
          </p>
        </div>
      </div>
    </main>
  );
}