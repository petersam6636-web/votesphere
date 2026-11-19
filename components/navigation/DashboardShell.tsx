
"use client";

import { useEffect, useState, type ReactNode } from "react";
import Slider from "./Slider";
import type { NavigationPosition } from "./NavigationCustomizer";

interface DashboardShellProps {
  children: ReactNode;
}

const STORAGE_KEY = "votesphere-navigation-position";

export default function DashboardShell({ children }: DashboardShellProps) {
  const [position, setPosition] = useState<NavigationPosition>("left");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (
        saved === "left" ||
        saved === "right" ||
        saved === "bottom"
      ) {
        setPosition(saved);
      }
    } catch {
      // Keep the default position if browser storage is unavailable.
    }

    setReady(true);
  }, []);

  const changePosition = (nextPosition: NavigationPosition) => {
    setPosition(nextPosition);

    try {
      localStorage.setItem(STORAGE_KEY, nextPosition);
    } catch {
      // The current selection still works for this session.
    }
  };

  return (
    <div className="relative min-h-dvh bg-[#070b09] text-zinc-100">
      <Slider
        position={position}
        onPositionChange={changePosition}
      />

      <main
        className={`min-h-dvh w-full transition-[padding] duration-300 ease-in-out ${
          position === "left"
            ? "md:pl-[88px] md:pr-5"
            : position === "right"
              ? "md:pl-5 md:pr-[88px]"
              : "md:px-5 md:pb-[92px]"
        }`}
      >
        <div className="mx-auto min-h-dvh w-full max-w-[1600px] px-4 pb-24 pt-5 sm:px-6 md:px-0 md:pb-6 md:pt-6">
          {ready ? children : (
            <div className="min-h-[60vh]" aria-hidden="true" />
          )}
        </div>
      </main>
    </div>
  );
}