
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Users,
  Share2,
  History,
  Settings,
  Vote,
} from "lucide-react";

import NavigationCustomizer, {
  type NavigationPosition,
} from "./NavigationCustomizer";

interface SliderProps {
  position: NavigationPosition;
  onPositionChange: (position: NavigationPosition) => void;
}

const navigation = [
  { label: "Home", href: "/home", icon: House },
  { label: "Nominees", href: "/home/nominees", icon: Users },
  { label: "Share", href: "/home/share", icon: Share2 },
  { label: "History", href: "/home/history", icon: History },
  { label: "Settings", href: "/home/settings", icon: Settings },
];

export default function Slider({
  position,
  onPositionChange,
}: SliderProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/home") return pathname === "/home";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const vertical = position !== "bottom";

  return (
    <>
      {/* Desktop and tablet navigation */}
      <aside
        className={`fixed z-50 hidden border-white/[0.08] bg-[#0b120e]/90 shadow-[0_10px_50px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition-all duration-300 md:flex ${
          vertical
            ? `top-1/2 h-[min(610px,calc(100dvh-40px))] w-[76px] -translate-y-1/2 flex-col items-center rounded-[24px] border py-4 ${
                position === "left" ? "left-4" : "right-4"
              }`
            : "bottom-5 left-1/2 h-[76px] w-auto -translate-x-1/2 items-center rounded-[24px] border px-4 py-2"
        }`}
      >
        <Link
          href="/home"
          aria-label="VoteSphere home"
          className={`flex shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.10)] ${
            vertical ? "h-11 w-11" : "mr-3 h-11 w-11"
          }`}
        >
          <Vote size={23} strokeWidth={1.8} />
        </Link>

        <div
          className={`flex ${
            vertical
              ? "my-5 h-px w-9 bg-white/[0.08]"
              : "mx-3 h-9 w-px bg-white/[0.08]"
          }`}
        />

        <nav
          aria-label="Main navigation"
          className={`flex ${
            vertical
              ? "flex-1 flex-col items-center gap-2"
              : "items-center gap-2"
          }`}
        >
          {navigation.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);

            return (
              <Link
                key={href}
                href={href}
                title={label}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`group relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-emerald-400/15 text-emerald-300 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.17),0_0_20px_rgba(16,185,129,0.08)]"
                    : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-100"
                }`}
              >
                {active && vertical && (
                  <span className="absolute -left-[13px] h-5 w-[3px] rounded-r-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
                )}

                <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />

                <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg border border-white/10 bg-[#111b15] px-2.5 py-1.5 text-[10px] font-medium text-white opacity-0 shadow-xl transition-all group-hover:block group-hover:opacity-100">
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div
          className={`flex ${
            vertical
              ? "my-4 h-px w-9 bg-white/[0.08]"
              : "mx-3 h-9 w-px bg-white/[0.08]"
          }`}
        />

        <NavigationCustomizer
          position={position}
          onPositionChange={onPositionChange}
        />
      </aside>

      {/* Mobile navigation */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-3 left-1/2 z-50 flex w-[calc(100%-24px)] max-w-[410px] -translate-x-1/2 items-center justify-around rounded-[20px] border border-white/[0.10] bg-[#0b120e]/95 px-2 py-2 shadow-[0_12px_45px_rgba(0,0,0,0.55)] backdrop-blur-2xl md:hidden"
      >
        {navigation.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`flex h-11 w-12 items-center justify-center rounded-xl transition-all ${
                active
                  ? "bg-emerald-400/15 text-emerald-300"
                  : "text-zinc-500 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
            </Link>
          );
        })}
      </nav>
    </>
  );
}
