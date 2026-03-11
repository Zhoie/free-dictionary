import { MagnifyingGlass, X } from "@phosphor-icons/react";
import type { CSSProperties } from "react";

type SearchFormProps = {
  value: string;
  isLoading: boolean;
  fieldError: string | null;
  suggestions: readonly string[];
  onClear: () => void;
  onSuggestionSelect: (value: string) => void;
  onValueChange: (value: string) => void;
};

export default function SearchForm({
  value,
  isLoading,
  fieldError,
  suggestions,
  onClear,
  onSuggestionSelect,
  onValueChange,
}: SearchFormProps) {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor="dictionary-term"
          className="section-label board-caption"
        >
          Search Term
        </label>
        <span
          className="toy-surface toy-badge"
          style={
            {
              "--toy-bg": isLoading ? "var(--yellow)" : "var(--purple)",
              "--toy-shadow": isLoading
                ? "var(--yellow-shadow)"
                : "var(--purple-shadow)",
              "--toy-ink": isLoading ? "#4f3810" : "var(--cream-soft)",
            } as CSSProperties
          }
        >
          {isLoading ? "Searching" : "Live Search"}
        </span>
      </div>

      <div className="grid gap-3">
        <div className="search-well group relative">
          <MagnifyingGlass
            size={19}
            weight="bold"
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-subtle)] transition-colors duration-200 group-focus-within:text-[var(--ink-strong)]"
          />
          <input
            id="dictionary-term"
            name="term"
            autoComplete="off"
            inputMode="search"
            enterKeyHint="search"
            spellCheck={false}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder="Type a word, for example cadence"
            className="search-input rounded-[1.35rem] px-11 py-3.5 pr-12 text-base"
            aria-invalid={fieldError ? "true" : undefined}
            aria-describedby="dictionary-input-help dictionary-input-error"
          />
          {value ? (
            <button
              type="button"
              onClick={onClear}
              className="toy-clear absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full"
              aria-label="Clear search"
            >
              <X size={16} weight="bold" aria-hidden />
            </button>
          ) : null}
        </div>

        <p id="dictionary-input-help" className="board-caption text-sm leading-relaxed">
          {isLoading
            ? "Searching the dictionary now."
            : "Results update as you type. Searches accept letters, spaces, apostrophes, and hyphens."}
        </p>
        <p
          id="dictionary-input-error"
          className={`min-h-[1.25rem] text-sm text-[#ffc4ba] transition-opacity duration-200 ${
            fieldError ? "opacity-100" : "opacity-0"
          }`}
          role="alert"
        >
          {fieldError ?? "\u00A0"}
        </p>

        <div className="flex flex-wrap items-start gap-3">
          <span className="section-label board-caption pt-3">
            Try
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((term, index) => {
              const isActive = value === term;

              return (
              <button
                key={term}
                type="button"
                onClick={() => onSuggestionSelect(term)}
                data-active={isActive ? "true" : "false"}
                className="toy-surface toy-chip toy-suggestion"
                style={
                  {
                    "--toy-rotate":
                      index % 2 === 0 ? "-2deg" : "2deg",
                    opacity: isActive ? 1 : 0.94,
                  } as CSSProperties
                }
              >
                {term}
              </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
