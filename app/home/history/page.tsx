
import { History, Trophy, CalendarDays, ChartNoAxesCombined } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="mb-2 text-xs font-medium tracking-wider text-emerald-400">PAST ACTIVITY</p>
        <h1 className="text-2xl font-bold">Election history<span className="text-emerald-400">.</span></h1>
        <p className="mt-1 text-sm text-zinc-500">Review completed elections and their results.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Completed elections", value: "00", icon: Trophy },
          { label: "Archived elections", value: "00", icon: History },
          { label: "Recorded votes", value: "00", icon: ChartNoAxesCombined },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-white/[0.07] bg-[#0d1310] p-4">
            <Icon size={18} className="text-emerald-400" />
            <p className="mt-4 text-2xl font-bold">{value}</p>
            <p className="mt-1 text-[11px] text-zinc-500">{label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-white/[0.07] bg-[#0d1310] p-5">
        <div className="flex items-center gap-3">
          <CalendarDays size={19} className="text-emerald-400" />
          <div>
            <h2 className="text-sm font-semibold">Previous elections</h2>
            <p className="mt-1 text-xs text-zinc-500">Your completed election records</p>
          </div>
        </div>

        <div className="flex min-h-64 flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.025] text-zinc-500">
            <History size={24} />
          </div>
          <h3 className="mt-4 text-sm font-semibold">Nothing in your history</h3>
          <p className="mt-2 max-w-sm text-xs leading-5 text-zinc-500">
            Completed elections and their verified results will be available here.
          </p>
        </div>
      </section>
    </div>
  );
}