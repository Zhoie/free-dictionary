import { MagnifyingGlass } from "@phosphor-icons/react";

type SearchFormProps = {
  value: string;
  isLoading: boolean;
  fieldError: string | null;
  onValueChange: (value: string) => void;
};

export default function SearchForm({
  value,
  isLoading,
  fieldError,
  onValueChange,
}: SearchFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="dictionary-term"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500"
        >
          English Word
        </label>
        <div className="relative">
          <MagnifyingGlass
            size={18}
            weight="bold"
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            id="dictionary-term"
            name="term"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder="Type a word, for example: cadence"
            className="w-full rounded-2xl border border-zinc-300 bg-white px-10 py-3 text-base text-zinc-900 outline-none transition duration-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            aria-invalid={fieldError ? "true" : undefined}
            aria-describedby="dictionary-input-help dictionary-input-error"
          />
        </div>
        <p id="dictionary-input-help" className="text-sm text-zinc-500">
          {isLoading
            ? "Searching..."
            : "Type to search automatically. Query accepts letters, spaces, apostrophes, and hyphens."}
        </p>
        <p
          id="dictionary-input-error"
          className={`text-sm text-rose-600 ${fieldError ? "opacity-100" : "opacity-0"}`}
          role="alert"
        >
          {fieldError ?? "\u00A0"}
        </p>
      </div>
    </div>
  );
}
