import {
  ArrowClockwise,
  MagnifyingGlass,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react";
import type { CSSProperties } from "react";

type SuggestionStateProps = {
  suggestions: readonly string[];
  onSuggestionSelect: (term: string) => void;
};

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

type LoadingStateProps = {
  query: string;
};

type NotFoundStateProps = SuggestionStateProps & {
  query: string;
};

export function EmptyState({
  suggestions,
  onSuggestionSelect,
}: SuggestionStateProps) {
  return (
    <section className="grid h-auto content-start gap-4 lg:h-full lg:grid-cols-[1.06fr_0.94fr]">
      <article className="calm-panel rounded-[1.8rem] p-5 sm:p-6">
        <div className="flex items-center gap-2 text-[var(--ink-strong)]">
          <Sparkle size={18} weight="fill" aria-hidden />
          <h2 className="font-[family:var(--font-display)] text-[1.9rem] font-semibold tracking-[-0.04em]">
            Start with a word
          </h2>
        </div>
        <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-[var(--ink-muted)]">
          Search an English word to load pronunciation, definitions, and source links.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {suggestions.map((term, index) => (
            <button
              key={term}
              type="button"
              onClick={() => onSuggestionSelect(term)}
              className="toy-surface toy-chip toy-suggestion"
              style={
                {
                  "--toy-rotate": index % 2 === 0 ? "-2deg" : "2deg",
                } as CSSProperties
              }
            >
              {term}
            </button>
          ))}
        </div>
      </article>

      <article className="calm-panel grid gap-3 rounded-[1.8rem] p-5 sm:p-6">
        <div>
          <p className="section-label text-[var(--ink-subtle)]">
            Included
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
            Pronunciation playback, phonetic text, grouped definitions, and source links.
          </p>
        </div>
        <div>
          <p className="section-label text-[var(--ink-subtle)]">
            Shareable URL
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
            The current lookup stays in the address bar so refreshes and shared links land on the same result.
          </p>
        </div>
      </article>
    </section>
  );
}

export function LoadingState({ query }: LoadingStateProps) {
  return (
    <section className="calm-panel grid h-auto content-start gap-4 rounded-[1.8rem] p-5 sm:p-6 lg:h-full">
      <div>
        <p className="section-label text-[var(--ink-subtle)]">
          Looking Up
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
          {query ? `Fetching definitions for "${query}".` : "Fetching dictionary data."}
        </p>
      </div>

      <div className="reading-card grid gap-3 rounded-[1.5rem] p-4">
        <div className="h-8 w-40 animate-pulse rounded-full bg-[rgb(201,178,119)]/40 motion-reduce:animate-none" />
        <div className="space-y-3">
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-[rgb(201,178,119)]/38 motion-reduce:animate-none" />
          <div className="h-4 w-full animate-pulse rounded-full bg-[rgb(201,178,119)]/38 motion-reduce:animate-none" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <article
            key={index}
            className="reading-card space-y-3 rounded-[1.3rem] p-4"
          >
            <div className="h-3 w-28 animate-pulse rounded-full bg-[rgb(201,178,119)]/38 motion-reduce:animate-none" />
            <div className="h-4 w-full animate-pulse rounded-full bg-[rgb(201,178,119)]/38 motion-reduce:animate-none" />
            <div className="h-4 w-5/6 animate-pulse rounded-full bg-[rgb(201,178,119)]/38 motion-reduce:animate-none" />
          </article>
        ))}
      </div>
    </section>
  );
}

export function NotFoundState({
  query,
  suggestions,
  onSuggestionSelect,
}: NotFoundStateProps) {
  return (
    <section className="calm-panel grid h-auto content-start gap-4 rounded-[1.8rem] p-5 sm:p-6 lg:h-full">
      <div className="flex items-center gap-2 text-[var(--ink-strong)]">
        <MagnifyingGlass size={18} weight="bold" aria-hidden />
        <h2 className="font-[family:var(--font-display)] text-[1.95rem] font-semibold tracking-[-0.04em]">
          No entry found
        </h2>
      </div>
      <p className="max-w-[42ch] text-sm leading-relaxed text-[var(--ink-muted)]">
        Nothing turned up for{" "}
        <span className="font-semibold">{query || "that search"}</span>. Try a nearby spelling or jump to a related term.
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((term, index) => (
          <button
            key={term}
            type="button"
            onClick={() => onSuggestionSelect(term)}
            className="toy-surface toy-chip toy-suggestion"
            style={
              {
                "--toy-rotate": index % 2 === 0 ? "-2deg" : "2deg",
              } as CSSProperties
            }
          >
            {term}
          </button>
        ))}
      </div>
    </section>
  );
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <section className="calm-panel grid h-auto content-start gap-4 rounded-[1.8rem] p-5 sm:p-6 lg:h-full">
      <div className="flex items-center gap-2 text-[var(--ink-strong)]">
        <WarningCircle size={18} weight="fill" aria-hidden />
        <h2 className="font-[family:var(--font-display)] text-[1.95rem] font-semibold tracking-[-0.04em]">
          Lookup failed
        </h2>
      </div>
      <p className="max-w-[42ch] text-sm leading-relaxed text-[var(--ink-muted)]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="toy-surface mt-2 inline-flex min-h-[46px] items-center gap-2 rounded-[1rem] px-4 py-2 text-sm font-semibold"
        style={
          {
            "--toy-bg": "var(--pink)",
            "--toy-shadow": "var(--pink-shadow)",
            "--toy-ink": "var(--cream-soft)",
          } as CSSProperties
        }
      >
        <ArrowClockwise size={16} weight="bold" aria-hidden />
        Retry
      </button>
    </section>
  );
}
