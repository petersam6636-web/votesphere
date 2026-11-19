
"use client";

import { useEffect, useRef, useState } from "react";
import { Check, PanelBottom, PanelLeft, PanelRight, Plus, X } from "lucide-react";

export type NavigationPosition = "left" | "right" | "bottom";

interface NavigationCustomizerProps {
  position: NavigationPosition;
  onPositionChange: (position: NavigationPosition) => void;
}

const positions = [
  { value: "left", label: "Left", icon: PanelLeft },
  { value: "right", label: "Right", icon: PanelRight },
  { value: "bottom", label: "Bottom", icon: PanelBottom },
] as const;

export default function NavigationCustomizer({
  position,
  onPositionChange,
}: NavigationCustomizerProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const selectPosition = (value: NavigationPosition) => {
    onPositionChange(value);
    setOpen(false);
  };

  return (
    <div ref={panelRef} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-label="Customize navigation position"
        aria-expanded={open}
        className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border transition-all ${
          open
            ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
            : "border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-300"
        }`}
      >
        {open ? <X size={19} /> : <Plus size={20} />}
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-[100] mt-3 w-52 -translate-x-1/2 rounded-2xl border border-emerald-400/15 bg-[#0c1510]/95 p-3 shadow-[0_18px_55px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          <div className="mb-3 px-1">
            <p className="text-xs font-semibold text-white">
              Navigation position
            </p>
            <p className="mt-1 text-[10px] text-zinc-500">
              Choose where your navigation appears.
            </p>
          </div>

          <div className="space-y-1.5">
            {positions.map(({ value, label, icon: Icon }) => {
              const active = position === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => selectPosition(value)}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-xs transition-all ${
                    active
                      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                      : "border-transparent text-zinc-400 hover:border-white/[0.07] hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={17} />
                    {label}
                  </span>

                  {active && <Check size={15} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
