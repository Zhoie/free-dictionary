import { ArrowClockwise, Sparkle, WarningCircle } from "@phosphor-icons/react";

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export function EmptyState() {
  return (
    <section className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50/90 p-6 sm:p-8">
      <div className="flex items-center gap-2 text-zinc-700">
        <Sparkle size={18} weight="fill" aria-hidden />
        <h2 className="text-lg font-semibold tracking-tight">
          Start with a word
        </h2>
      </div>
      <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-zinc-600">
        Search an English word to load pronunciation, phonetic text, and
        meaning blocks. The query appears in URL so you can refresh or share.
      </p>
    </section>
  );
}

export function LoadingState() {
  return (
    <section className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
      <div className="h-8 w-40 animate-pulse rounded-xl bg-zinc-200" />
      <div className="space-y-3">
        <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200" />
        <div className="h-4 w-full animate-pulse rounded bg-zinc-200" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-200" />
      </div>
      <div className="space-y-2 border-t border-zinc-100 pt-4">
        <div className="h-4 w-28 animate-pulse rounded bg-zinc-200" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-zinc-200" />
      </div>
    </section>
  );
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <section className="rounded-3xl border border-rose-200 bg-rose-50/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] sm:p-6">
      <div className="flex items-center gap-2 text-rose-700">
        <WarningCircle size={18} weight="fill" aria-hidden />
        <h2 className="text-lg font-semibold tracking-tight">
          Lookup failed
        </h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-rose-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition duration-300 hover:bg-rose-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:border-rose-200 disabled:text-rose-400"
      >
        <ArrowClockwise size={16} weight="bold" aria-hidden />
        Retry
      </button>
    </section>
  );
}
