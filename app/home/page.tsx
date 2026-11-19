
import Link from "next/link";
import {
  ArrowUpRight,
  Plus,
  Vote,
  Users,
  CalendarDays,
  ChartNoAxesCombined,
  Clock3,
  CircleDot,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const stats = [
  { label: "Total elections", value: "00", icon: Vote, detail: "All your elections" },
  { label: "Total nominees", value: "00", icon: Users, detail: "Across all elections" },
  { label: "Active elections", value: "00", icon: CircleDot, detail: "Currently running" },
  { label: "Total votes", value: "00", icon: ChartNoAxesCombined, detail: "Votes received" },
];

const activities = [
  { title: "Welcome to VoteSphere", detail: "Your election workspace is ready.", time: "Just now" },
  { title: "Set up your first election", detail: "Start by creating an election.", time: "Next step" },
];

export default function HomePage() {
  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-emerald-400">
            <Sparkles size={14} />
            YOUR ELECTION WORKSPACE
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Dashboard<span className="text-emerald-400">.</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your elections and keep every vote organized.
          </p>
        </div>

        <button
          type="button"
          disabled
          title="Election creation will be connected in the next stage"
          className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-xl bg-emerald-400 px-4 text-xs font-bold text-[#062116] opacity-70"
        >
          <Plus size={16} />
          Create election
        </button>
      </header>

      <section className="relative overflow-hidden rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-[#103323] via-[#0c1c14] to-[#0b110e] p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-emerald-400/10 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-56 w-56 rounded-full bg-emerald-500/[0.07] blur-[80px]" />

        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            WELCOME TO VOTESPHERE
          </span>

          <h2 className="mt-5 text-2xl font-bold leading-tight sm:text-3xl">
            Every voice deserves
            <span className="block text-emerald-400">to be heard.</span>
          </h2>

          <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400">
            Create organized elections, manage nominees, invite voters and
            follow results from one secure workspace.
          </p>

          <Link
            href="/home/nominees"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
          >
            Explore nominees
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="pointer-events-none absolute bottom-5 right-7 hidden h-36 w-36 items-center justify-center rounded-full border border-emerald-300/10 bg-emerald-300/[0.04] sm:flex">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-400/[0.06] shadow-[0_0_50px_rgba(16,185,129,0.12)]">
            <Vote size={43} className="text-emerald-300" strokeWidth={1.2} />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Your overview</h2>
            <p className="mt-1 text-xs text-zinc-500">A snapshot of your workspace</p>
          </div>
          <span className="text-[10px] text-zinc-600">LIVE DATA COMING SOON</span>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, detail }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/[0.07] bg-[#0d1310] p-4 transition hover:border-emerald-400/20"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-zinc-500">{label}</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/[0.09] text-emerald-400">
                  <Icon size={16} />
                </div>
              </div>
              <p className="mt-4 text-2xl font-bold tabular-nums">{value}</p>
              <p className="mt-1 text-[10px] text-zinc-600">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-white/[0.07] bg-[#0d1310] p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Recent elections</h2>
              <p className="mt-1 text-xs text-zinc-500">Your latest election activity</p>
            </div>
            <CalendarDays size={18} className="text-emerald-400" />
          </div>

          <div className="mt-7 flex min-h-36 flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025] text-zinc-500">
              <Vote size={22} />
            </div>
            <p className="mt-3 text-xs font-medium text-zinc-300">No elections yet</p>
            <p className="mt-1 max-w-xs text-[11px] leading-5 text-zinc-600">
              Your elections will appear here when you create your first one.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#0d1310] p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Getting started</h2>
              <p className="mt-1 text-xs text-zinc-500">Your next steps</p>
            </div>
            <Clock3 size={18} className="text-emerald-400" />
          </div>

          <div className="mt-5 space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.title} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-xs font-bold text-emerald-400">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-200">{activity.title}</p>
                  <p className="mt-1 text-[11px] text-zinc-500">{activity.detail}</p>
                  <p className="mt-1 text-[10px] text-zinc-600">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="flex items-center justify-between border-t border-white/[0.06] pt-4 text-[10px] text-zinc-600">
        <span>VoteSphere Workspace</span>
        <span className="flex items-center gap-1.5">
          <ArrowUpRight size={12} />
          Your voice. Your choice.
        </span>
      </footer>
    </div>
  );
}