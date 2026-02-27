"use client";

import {
  LinkSimple,
  Quotes,
  SpeakerHigh,
  SpeakerSlash,
} from "@phosphor-icons/react";
import { motion, type Variants, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import type { DictionaryResult } from "@/types/dictionary";

type ResultPanelProps = {
  result: DictionaryResult;
  onPlayAudio: (audioUrl: string) => void;
};

type PanelKey = "definitions" | "sources";

type DefinitionRecord = {
  id: string;
  word: string;
  partOfSpeech: string;
  definition: string;
  example: string | null;
  synonyms: string[];
  antonyms: string[];
};

type SourceRecord = {
  id: string;
  url: string;
};

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
    },
  },
};

const panelOptions: Array<{ key: PanelKey; label: string }> = [
  { key: "definitions", label: "Definitions" },
  { key: "sources", label: "Sources" },
];

const uniqueStrings = (values: string[]) => [...new Set(values)];

const summarizeTerms = (values: string[], limit = 8) => {
  const unique = uniqueStrings(values.filter(Boolean));
  return {
    shown: unique.slice(0, limit),
    hiddenCount: Math.max(unique.length - limit, 0),
  };
};

export default function ResultPanel({ result, onPlayAudio }: ResultPanelProps) {
  const shouldReduceMotion = useReducedMotion();

  const [activePanel, setActivePanel] = useState<PanelKey>("definitions");

  const primaryEntry = result.entries[0];
  const titlePhonetic = uniqueStrings(
    result.entries
      .flatMap((entry) => entry.phonetics)
      .map((item) => item.text ?? "")
      .filter(Boolean),
  ).join(" · ");
  const headerPronunciations = useMemo(
    () =>
      uniqueStrings(
        result.entries
          .flatMap((entry) => entry.phonetics)
          .map((item) => item.audio ?? "")
          .filter(Boolean),
      ),
    [result],
  );

  const definitions = useMemo<DefinitionRecord[]>(
    () =>
      result.entries.flatMap((entry, entryIndex) =>
        entry.meanings.flatMap((meaning, meaningIndex) =>
          meaning.definitions.map((definition, definitionIndexValue) => ({
            id: `${entry.word}-${entryIndex}-${meaning.partOfSpeech}-${meaningIndex}-${definitionIndexValue}`,
            word: entry.word,
            partOfSpeech: meaning.partOfSpeech,
            definition: definition.definition,
            example: definition.example,
            synonyms: uniqueStrings([
              ...meaning.synonyms,
              ...definition.synonyms,
            ]),
            antonyms: uniqueStrings([
              ...meaning.antonyms,
              ...definition.antonyms,
            ]),
          })),
        ),
      ),
    [result],
  );

  const sources = useMemo<SourceRecord[]>(
    () =>
      uniqueStrings(result.entries.flatMap((entry) => entry.sourceUrls)).map(
        (url, index) => ({
          id: `source-${index}`,
          url,
        }),
      ),
    [result],
  );

  const panelTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 100, damping: 20 };

  return (
    <motion.section
      layout
      variants={containerVariants}
      initial={shouldReduceMotion ? false : "hidden"}
      animate="show"
      className="grid h-full min-h-0 grid-rows-[auto_auto_1fr] gap-3"
    >
      <motion.header
        layout
        layoutId={`dictionary-word-${result.term}`}
        transition={panelTransition}
        className="rounded-2xl border border-zinc-200 bg-zinc-50/85 p-4 sm:p-5"
      >
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
          Current Word
        </p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h2 className="min-w-0 break-words text-2xl font-semibold tracking-tight text-zinc-900 text-balance sm:text-3xl">
            {primaryEntry.word}
          </h2>
          <div className="flex max-w-[45%] shrink-0 flex-wrap justify-end gap-2">
            {headerPronunciations.length > 0 ? (
              headerPronunciations.map((audioUrl, index) => (
                <button
                  key={`${audioUrl}-${index}`}
                  type="button"
                  onClick={() => onPlayAudio(audioUrl)}
                  aria-label={`Play pronunciation ${index + 1} for ${primaryEntry.word}`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition-colors duration-300 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-50"
                >
                  <SpeakerHigh size={18} weight="fill" aria-hidden />
                </button>
              ))
            ) : (
              <button
                type="button"
                disabled
                aria-label={`Pronunciation audio unavailable for ${primaryEntry.word}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400"
              >
                <SpeakerSlash size={18} weight="fill" aria-hidden />
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 text-sm text-zinc-600">
          {titlePhonetic || "No phonetic notation available."}
        </p>
      </motion.header>

      <nav className="grid grid-cols-2 gap-2" aria-label="Result panels">
        {panelOptions.map((option) => {
          const isActive = activePanel === option.key;

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setActivePanel(option.key)}
              aria-pressed={isActive}
              className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                isActive
                  ? "border-emerald-300 bg-emerald-100/80 text-emerald-800"
                  : "border-zinc-300 bg-white text-zinc-600 hover:border-emerald-200 hover:text-zinc-900"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </nav>

      <motion.section
        key={`${result.term}-${activePanel}`}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
        transition={panelTransition}
        className="min-h-0 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5"
      >
        {activePanel === "definitions" ? (
          <div className="h-full min-h-0 space-y-3 overflow-y-auto pr-1">
            {definitions.length > 0 ? (
              definitions.map((definition, index) => {
                const definitionSynonyms = summarizeTerms(definition.synonyms);
                const definitionAntonyms = summarizeTerms(definition.antonyms);

                return (
                  <article
                    key={definition.id}
                    className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                      {index + 1}. {definition.word} · {definition.partOfSpeech}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-800 break-words">
                      {definition.definition}
                    </p>
                    {definition.example ? (
                      <p className="mt-2 flex items-start gap-2 border-l-2 border-emerald-200 pl-3 text-sm leading-relaxed text-zinc-600 break-words">
                        <Quotes
                          size={14}
                          weight="bold"
                          aria-hidden
                          className="mt-0.5 shrink-0"
                        />
                        <span>{definition.example}</span>
                      </p>
                    ) : null}

                    {definitionSynonyms.shown.length > 0 ? (
                      <p className="mt-3 text-xs text-zinc-600 break-words">
                        <span className="font-semibold uppercase tracking-[0.1em] text-zinc-500">
                          Synonyms:
                        </span>{" "}
                        {definitionSynonyms.shown.join(", ")}
                        {definitionSynonyms.hiddenCount > 0
                          ? ` +${definitionSynonyms.hiddenCount}`
                          : ""}
                      </p>
                    ) : null}

                    {definitionAntonyms.shown.length > 0 ? (
                      <p className="mt-2 text-xs text-zinc-600 break-words">
                        <span className="font-semibold uppercase tracking-[0.1em] text-zinc-500">
                          Antonyms:
                        </span>{" "}
                        {definitionAntonyms.shown.join(", ")}
                        {definitionAntonyms.hiddenCount > 0
                          ? ` +${definitionAntonyms.hiddenCount}`
                          : ""}
                      </p>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <article className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600">
                No definition data is available for this entry.
              </article>
            )}
          </div>
        ) : null}

        {activePanel === "sources" ? (
          <div className="h-full min-h-0 overflow-y-auto pr-1">
            {sources.length > 0 ? (
              <ul className="space-y-2">
                {sources.map((source) => (
                  <li key={source.id}>
                    <article className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-start gap-2 text-sm text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition-colors duration-300 hover:text-emerald-700"
                      >
                        <LinkSimple size={14} weight="bold" aria-hidden />
                        <span className="break-all">{source.url}</span>
                      </a>
                    </article>
                  </li>
                ))}
              </ul>
            ) : (
              <article className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600">
                No source links are available for this term.
              </article>
            )}
          </div>
        ) : null}
      </motion.section>
    </motion.section>
  );
}
