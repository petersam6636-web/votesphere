
import { Settings, UserRound, ShieldCheck, Bell, Palette, Database } from "lucide-react";

const settings = [
  {
    title: "Profile",
    description: "Manage your account information and personal details.",
    icon: UserRound,
  },
  {
    title: "Security",
    description: "Review account security and authentication options.",
    icon: ShieldCheck,
  },
  {
    title: "Notifications",
    description: "Manage election updates and notification preferences.",
    icon: Bell,
  },
  {
    title: "Appearance",
    description: "VoteSphere uses its dark emerald interface.",
    icon: Palette,
  },
  {
    title: "Data and privacy",
    description: "Information about your account and election data.",
    icon: Database,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="mb-2 text-xs font-medium tracking-wider text-emerald-400">PREFERENCES</p>
        <h1 className="text-2xl font-bold">Settings<span className="text-emerald-400">.</span></h1>
        <p className="mt-1 text-sm text-zinc-500">Manage your VoteSphere account and preferences.</p>
      </header>

      <section className="rounded-2xl border border-white/[0.07] bg-[#0d1310] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
            <Settings size={21} />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Application settings</h2>
            <p className="mt-1 text-xs text-zinc-500">Your workspace preferences</p>
          </div>
        </div>

        <div className="mt-5 divide-y divide-white/[0.06]">
          {settings.map(({ title, description, icon: Icon }) => (
            <div key={title} className="flex items-center gap-3 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-400">
                <Icon size={17} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-zinc-200">{title}</h3>
                <p className="mt-1 text-[11px] leading-5 text-zinc-500">{description}</p>
              </div>
              <span className="ml-auto shrink-0 text-[10px] text-zinc-600">Coming next</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}