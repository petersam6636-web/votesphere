
import { Users, Plus, Search, UserRound, Vote } from "lucide-react";

export default function NomineesPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-2 text-xs font-medium tracking-wider text-emerald-400">ELECTION MANAGEMENT</p>
          <h1 className="text-2xl font-bold">Nominees<span className="text-emerald-400">.</span></h1>
          <p className="mt-1 text-sm text-zinc-500">Manage candidates participating in your elections.</p>
        </div>
        <button disabled title="Candidate creation will be connected to Supabase" className="flex h-10 cursor-not-allowed items-center gap-2 rounded-xl bg-emerald-400 px-4 text-xs font-bold text-[#062116] opacity-70">
          <Plus size={16} /> Add nominee
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Total nominees", value: "00", icon: Users },
          { label: "Elections", value: "00", icon: Vote },
          { label: "Profiles", value: "00", icon: UserRound },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-white/[0.07] bg-[#0d1310] p-4">
            <Icon size={18} className="text-emerald-400" />
            <p className="mt-4 text-2xl font-bold">{value}</p>
            <p className="mt-1 text-[11px] text-zinc-500">{label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-white/[0.07] bg-[#0d1310] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">All nominees</h2>
            <p className="mt-1 text-xs text-zinc-500">Your candidate directory</p>
          </div>
          <div className="flex h-9 w-full max-w-xs items-center gap-2 rounded-xl border border-white/[0.08] bg-black/20 px-3">
            <Search size={15} className="text-zinc-500" />
            <input disabled placeholder="Search nominees..." className="w-full bg-transparent text-xs text-white outline-none placeholder:text-zinc-600" />
          </div>
        </div>

        <div className="flex min-h-64 flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-400">
            <Users size={25} />
          </div>
          <h3 className="mt-4 text-sm font-semibold">No nominees yet</h3>
          <p className="mt-2 max-w-sm text-xs leading-5 text-zinc-500">
            Once you create an election and add its candidates, their profiles will appear here.
          </p>
        </div>
      </section>
    </div>
  );
}