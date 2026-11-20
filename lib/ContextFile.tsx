"use client";

import { useEffect, useState, type ReactNode } from "react";

import { appContext } from "./appContext";

import type {
  Project,
  ProjectDetail,
} from "@/types/project";

export default function ContextFile({
  children,
}: {
  children: ReactNode;
}) {
  const [browserStatus, setBrowserStatus] = useState<
    "checking" | "supported" | "unsupported"
  >("checking");
  const [project, setProject] = useState<Project[] | null>(null);

  const [taskKey, setTaskKey] = useState<boolean | null>(null);

  const [userInfo, setUserInfo] = useState("");

  const [projectDetails, setProjectDetails] =
    useState<ProjectDetail | null>(null);

  const [currentProject, setCurrentProject] =
    useState<Project | null>(null);

  useEffect(() => {
    let active = true;

    async function checkBrowser() {
      const browserNavigator = navigator as Navigator & {
        userAgentData?: { brands: Array<{ brand: string }> };
        brave?: { isBrave?: () => Promise<boolean> };
      };
      const brands = browserNavigator.userAgentData?.brands.map(({ brand }) =>
        brand.toLowerCase(),
      );
      const userAgent = navigator.userAgent;
      const isChromeUserAgent =
        /(?:Chrome|CriOS)\//i.test(userAgent) &&
        !/(?:Edg|OPR|Opera|SamsungBrowser|Vivaldi|YaBrowser|DuckDuckGo|UCBrowser|MiuiBrowser)/i.test(
          userAgent,
        );
      const isChrome =
        brands?.some((brand) => brand === "google chrome") ??
        isChromeUserAgent;
      const isBrave = isChrome && (await browserNavigator.brave?.isBrave?.());

      if (active) {
        setBrowserStatus(isChrome && !isBrave ? "supported" : "unsupported");
      }
    }

    void checkBrowser();

    return () => {
      active = false;
    };
  }, []);

  return (
    <appContext.Provider
      value={{
        userInfo,
        setUserInfo,

        project,
        setProject,

        taskKey,
        setTaskKey,

        projectDetails,
        setProjectDetails,

        currentProject,
        setCurrentProject,
      }}
    >
      {browserStatus === "supported" ? (
        children
      ) : (
        <main className="flex min-h-screen items-center justify-center bg-[#070b09] px-6 text-[#f4f4f5]">
          <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1310] p-8 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
              VoteSphere
            </p>
            <h1 className="mt-4 text-2xl font-semibold">
              {browserStatus === "checking"
                ? "Checking your browser"
                : "Google Chrome required"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              {browserStatus === "checking"
                ? "Please wait while we check browser compatibility."
                : "For the best experience, VoteSphere is available only in Google Chrome. Open this site in Chrome to continue."}
            </p>
          </section>
        </main>
      )}
    </appContext.Provider>
  );
}