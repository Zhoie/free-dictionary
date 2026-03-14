"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import type { CSSProperties, FormEvent } from "react";
import SuggestionChips from "@/components/dictionary/suggestion-chips";
import { sanitizeTerm } from "@/lib/dictionary";

type SearchFormProps = {
  value: string;
  isLoading: boolean;
  isCondensed: boolean;
  showSuggestions: boolean;
  fieldError: string | null;
  suggestions: readonly string[];
  onClear: () => void;
  onSuggestionSelect: (value: string) => void;
  onSubmit: () => void;
  onValueChange: (value: string) => void;
};

export default function SearchForm({
  value,
  isLoading,
  isCondensed,
  showSuggestions,
  fieldError,
  suggestions,
  onClear,
  onSuggestionSelect,
  onSubmit,
  onValueChange,
}: SearchFormProps) {
  const shouldReduceMotion = useReducedMotion();
  const activeTerm = sanitizeTerm(value);
  const hasSuggestionRail = showSuggestions && suggestions.length > 0;
  const suggestionLabel = activeTerm ? "Try Next" : "Try These";
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      role="search"
      aria-label="Dictionary search"
      className="search-form"
      data-condensed={isCondensed ? "true" : "false"}
      onSubmit={handleSubmit}
    >
      <div className="search-form-header">
        <label
          htmlFor="dictionary-term"
          className="section-label board-caption"
        >
          Search Term
        </label>
        <span
          className="status-pill"
          aria-hidden="true"
          style={
            {
              "--status-bg": isLoading ? "var(--yellow)" : "var(--purple)",
              "--status-shadow": isLoading
                ? "var(--yellow-shadow)"
                : "var(--purple-shadow)",
              "--status-ink": isLoading
                ? "var(--tone-sun-ink)"
                : "var(--cream-soft)",
            } as CSSProperties
          }
        >
          {isLoading ? "Searching" : "Live Search"}
        </span>
      </div>

      <div className="search-form-body">
        <div className="search-well-frame">
          <div className="search-well group relative">
            <MagnifyingGlass
              size={18}
              weight="bold"
              aria-hidden
              className="search-icon"
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
              className="search-input"
              aria-invalid={fieldError ? "true" : undefined}
              aria-describedby="dictionary-input-help dictionary-input-error"
            />
            {value ? (
              <button
                type="button"
                onClick={onClear}
                className="toy-clear search-clear"
                aria-label="Clear search"
              >
                <X size={16} weight="bold" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>

        <p id="dictionary-input-help" className="search-help-copy board-caption">
          {isLoading
            ? "Searching the dictionary now."
            : "Results update as you type. Searches accept letters, spaces, apostrophes, and hyphens."}
        </p>
        <p
          id="dictionary-input-error"
          className={`search-error-copy min-h-[1.25rem] text-[var(--status-error)] transition-opacity duration-200 ${
            fieldError ? "opacity-100" : "opacity-0"
          }`}
          role="alert"
        >
          {fieldError ?? "\u00A0"}
        </p>

        <AnimatePresence initial={false}>
          {hasSuggestionRail ? (
            <motion.div
              key="try-rail"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="search-suggestion-rail"
            >
              <span className="search-suggestion-label section-label board-caption">
                {suggestionLabel}
              </span>
              <SuggestionChips
                suggestions={suggestions}
                activeTerm={activeTerm}
                onSuggestionSelect={onSuggestionSelect}
                className="flex flex-wrap gap-2.5"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </form>
  );
}
