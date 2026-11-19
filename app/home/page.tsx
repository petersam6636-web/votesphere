
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase-client";
import useApp from "@/lib/useApp";

import NoProject from "@/components/NoProject";
import ActiveProject, { type Project } from "@/components/ActiveProject";
import FinishedProject from "@/components/FinishedProject";
import ProjectLoading from "@/components/ProjectLoading";

export default function HomePage() {
  const { userInfo, setUserInfo } = useApp();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [taskKey, setTaskKey] = useState<boolean | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get the authenticated user.
  useEffect(() => {
    let active = true;

    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) throw error;

        if (!data.user) {
          router.replace("/");
          return;
        }

        if (!active) return;

        setUserInfo(data.user.id);
        setAuthReady(true);
      } catch (err: unknown) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to verify your account."
        );
        setLoading(false);
      }
    };

    void checkUser();

    return () => {
      active = false;
    };
  }, [setUserInfo, router]);

  // Find the task and project belonging to this user.
  useEffect(() => {
    if (!authReady || !userInfo) return;

    let active = true;

    const loadHomepage = async () => {
      setLoading(true);
      setError("");

      try {
        const [taskResult, projectResult] = await Promise.all([
          supabase
            .from("tasks")
            .select("key")
            .eq("user_id", userInfo)
            .maybeSingle(),

          supabase
            .from("projects")
            .select("id, name, description")
            .eq("user_id", userInfo)
            .eq("deleted", false)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle(),
        ]);

        if (taskResult.error) throw taskResult.error;
        if (projectResult.error) throw projectResult.error;

        if (!active) return;

        // Missing task record is treated as key = false.
        setTaskKey(taskResult.data?.key === true);

        // No matching project results in null.
        setProject(projectResult.data as Project | null);
      } catch (err: unknown) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your project."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadHomepage();

    return () => {
      active = false;
    };
  }, [authReady, userInfo]);

  if (loading || !authReady || taskKey === null) {
    return <ProjectLoading />;
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <p role="alert" className="text-center text-sm text-red-300">
          {error}
        </p>
      </div>
    );
  }

  // CONDITION 1:
  // key is false and no project exists.
  if (taskKey === false && !project) {
    return <NoProject />;
  }

  // CONDITION 2:
  // key is false and a project exists.
  if (taskKey === false && project) {
    return <FinishedProject project={project} />;
  }

  // CONDITION 3:
  // key is true and a project exists.
  if (taskKey === true && project) {
    return <ActiveProject project={project} />;
  }

  // Invalid database combination:
  // key is true but no project exists.
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <p className="text-center text-sm text-amber-300">
        Your election workspace needs attention. Please try again.
      </p>
    </div>
  );
}
