
import { CheckCircle2, Trophy } from "lucide-react";
import type { Project } from "@/types/project";

type FinishedProjectProps = {
  project: Project[];
};

export default function FinishedProject({
  project,
}: FinishedProjectProps) {
  return (
    <div className="w-full space-y-4">
      {project.map((item) => (
        <section
          key={item.id}
          className="relative overflow-hidden rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-[#103323] via-[#0c1c14] to-[#0b110e] p-6"
        >
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-400/[0.08] blur-[70px]" />

        <div className="relative">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-400">
            <CheckCircle2 size={15} />
            ELECTION COMPLETED
          </div>

          <h1 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
            {item.name}
            <span className="text-emerald-400">.</span>
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
            {item.description || "This election has been completed."}
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.08] px-4 py-2 text-xs font-medium text-emerald-300">
            <Trophy size={15} />
            Voting has ended
          </div>
        </div>
        </section>
      ))}

      <section className="rounded-2xl border border-white/[0.07] bg-[#0d1310] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
            <Trophy size={20} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">
              Election results
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Your results, nominees, votes and achievements will appear here.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
