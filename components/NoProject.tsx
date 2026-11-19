
"use client";

import { useRouter } from "next/navigation";
import { Plus, Vote } from "lucide-react";

export default function NoProject() {
  const router = useRouter();

  return (
    <div className="flex min-h-[65vh] w-full items-center justify-center px-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-emerald-400/15 bg-[#0d1310] px-6 py-10 text-center">
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-400/[0.08] blur-[70px]" />

        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-400">
          <Vote size={30} strokeWidth={1.5} />
        </div>

        <h2 className="mt-6 text-xl font-bold text-white">
          No project yet<span className="text-emerald-400">.</span>
        </h2>

        <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-zinc-500">
          You haven't created an election project yet. Start your first
          project and give everyone a chance to be heard.
        </p>

        <button
          type="button"
          onClick={() => router.push("/home/starting")}
          title="Add a new vote"
          aria-label="Add a new vote"
          className="mx-auto mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-[#062116] transition hover:bg-emerald-300 active:scale-95"
        >
          <Plus size={17} />
          Add Vote
        </button>
      </div>
    </div>
  );
}
