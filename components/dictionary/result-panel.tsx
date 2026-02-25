"use client";

import {
  CaretLeft,
  CaretRight,
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

type PanelKey = "overview" | "definitions" | "audio" | "sources";

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

type PhoneticRecord = {
  id: string;
  text: string | null;
  audio: string | null;
  sourceUrl: string | null;
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
  { key: "overview", label: "Overview" },
  { key: "definitions", label: "Definitions" },
  { key: "audio", label: "Audio" },
  { key: "sources", label: "Sources" },
];

const uniqueStrings = (values: string[]) => [...new Set(values)];

const getWrappedIndex = (index: number, count: number) => {
  if (count === 0) {
    return 0;
  }

  const wrapped = index % count;
  return wrapped < 0 ? wrapped + count : wrapped;
};

const summarizeTerms = (values: string[], limit = 8) => {
  const unique = uniqueStrings(values.filter(Boolean));
  return {
    shown: unique.slice(0, limit),
    hiddenCount: Math.max(unique.length - limit, 0),
  };
};

export default function ResultPanel({ result, onPlayAudio }: ResultPanelProps) {
  const shouldReduceMotion = useReducedMotion();

  const [activePanel, setActivePanel] = useState<PanelKey>("overview");
  const [definitionIndex, setDefinitionIndex] = useState(0);
  const [phoneticIndex, setPhoneticIndex] = useState(0);
  const [sourceIndex, setSourceIndex] = useState(0);

  const primaryEntry = result.entries[0];
  const titlePhonetic = primaryEntry?.phonetics.find((item) => item.text)?.text;

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

  const phonetics = useMemo<PhoneticRecord[]>(
    () =>
      result.entries
        .flatMap((entry, entryIndex) =>
          entry.phonetics.map((phonetic, phoneticIndexValue) => ({
            id: `${entry.word}-${entryIndex}-phonetic-${phoneticIndexValue}`,
            text: phonetic.text,
            audio: phonetic.audio,
            sourceUrl: phonetic.sourceUrl,
          })),
        )
        .filter((item) => item.text || item.audio),
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

  const currentDefinition =
    definitions[getWrappedIndex(definitionIndex, definitions.length)] ?? null;
  const currentPhonetic =
    phonetics[getWrappedIndex(phoneticIndex, phonetics.length)] ?? null;
  const currentSource = sources[getWrappedIndex(sourceIndex, sources.length)] ?? null;

  const definitionSynonyms = summarizeTerms(currentDefinition?.synonyms ?? []);
  const definitionAntonyms = summarizeTerms(currentDefinition?.antonyms ?? []);

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
        <h2 className="mt-1 break-words text-2xl font-semibold tracking-tight text-zinc-900 text-balance sm:text-3xl">
          {primaryEntry.word}
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          {titlePhonetic ?? "No phonetic notation available."}
        </p>
      </motion.header>

      <nav
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        aria-label="Result panels"
      >
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
        {activePanel === "overview" ? (
          <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-3">
            <div className="grid grid-cols-3 gap-2">
              <article className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">
                  Meanings
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900">
                  {definitions.length}
                </p>
              </article>
              <article className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">
                  Audio
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900">
                  {phonetics.filter((item) => Boolean(item.audio)).length}
                </p>
              </article>
              <article className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">
                  Sources
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900">
                  {sources.length}
                </p>
              </article>
            </div>

            <article className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                Definition Preview
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700 break-words">
                {currentDefinition?.definition ?? "No definitions available."}
              </p>
              {currentDefinition?.example ? (
                <p className="mt-2 flex items-start gap-2 border-l-2 border-emerald-200 pl-3 text-sm leading-relaxed text-zinc-600 break-words">
                  <Quotes
                    size={14}
                    weight="bold"
                    aria-hidden
                    className="mt-0.5 shrink-0"
                  />
                  <span>{currentDefinition.example}</span>
                </p>
              ) : null}
            </article>
          </div>
        ) : null}

        {activePanel === "definitions" ? (
          <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-3">
            <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-600">
                {definitions.length > 0
                  ? `Definition ${getWrappedIndex(definitionIndex, definitions.length) + 1} of ${definitions.length}`
                  : "No definitions available"}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDefinitionIndex((value) => value - 1)}
                  disabled={definitions.length <= 1}
                  aria-label="Previous definition"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition-colors duration-300 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
                >
                  <CaretLeft size={14} weight="bold" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setDefinitionIndex((value) => value + 1)}
                  disabled={definitions.length <= 1}
                  aria-label="Next definition"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition-colors duration-300 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
                >
                  <CaretRight size={14} weight="bold" aria-hidden />
                </button>
              </div>
            </div>

            {currentDefinition ? (
              <article className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                  {currentDefinition.word} · {currentDefinition.partOfSpeech}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-800 break-words">
                  {currentDefinition.definition}
                </p>
                {currentDefinition.example ? (
                  <p className="mt-2 flex items-start gap-2 border-l-2 border-emerald-200 pl-3 text-sm leading-relaxed text-zinc-600 break-words">
                    <Quotes
                      size={14}
                      weight="bold"
                      aria-hidden
                      className="mt-0.5 shrink-0"
                    />
                    <span>{currentDefinition.example}</span>
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
            ) : (
              <article className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600">
                No definition data is available for this entry.
              </article>
            )}
          </div>
        ) : null}

        {activePanel === "audio" ? (
          <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-3">
            <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-600">
                {phonetics.length > 0
                  ? `Pronunciation ${getWrappedIndex(phoneticIndex, phonetics.length) + 1} of ${phonetics.length}`
                  : "No pronunciation records"}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPhoneticIndex((value) => value - 1)}
                  disabled={phonetics.length <= 1}
                  aria-label="Previous pronunciation"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition-colors duration-300 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
                >
                  <CaretLeft size={14} weight="bold" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setPhoneticIndex((value) => value + 1)}
                  disabled={phonetics.length <= 1}
                  aria-label="Next pronunciation"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition-colors duration-300 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
                >
                  <CaretRight size={14} weight="bold" aria-hidden />
                </button>
              </div>
            </div>

            {currentPhonetic ? (
              <article className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
                <p className="text-sm font-semibold text-zinc-800 break-words">
                  {currentPhonetic.text ?? "Pronunciation variant"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!currentPhonetic.audio}
                    onClick={() => {
                      if (currentPhonetic.audio) {
                        onPlayAudio(currentPhonetic.audio);
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors duration-300 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
                    aria-label={
                      currentPhonetic.audio
                        ? "Play pronunciation audio"
                        : "Pronunciation audio unavailable"
                    }
                  >
                    {currentPhonetic.audio ? (
                      <SpeakerHigh size={16} weight="fill" aria-hidden />
                    ) : (
                      <SpeakerSlash size={16} weight="fill" aria-hidden />
                    )}
                    {currentPhonetic.audio ? "Play audio" : "Audio unavailable"}
                  </button>
                </div>
                {currentPhonetic.sourceUrl ? (
                  <a
                    href={currentPhonetic.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-start gap-2 text-sm text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition-colors duration-300 hover:text-emerald-700"
                  >
                    <LinkSimple size={14} weight="bold" aria-hidden />
                    <span className="break-all">{currentPhonetic.sourceUrl}</span>
                  </a>
                ) : null}
              </article>
            ) : (
              <article className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600">
                Pronunciation audio is not available for this term.
              </article>
            )}
          </div>
        ) : null}

        {activePanel === "sources" ? (
          <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-3">
            <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-600">
                {sources.length > 0
                  ? `Source ${getWrappedIndex(sourceIndex, sources.length) + 1} of ${sources.length}`
                  : "No source URLs"}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSourceIndex((value) => value - 1)}
                  disabled={sources.length <= 1}
                  aria-label="Previous source"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition-colors duration-300 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
                >
                  <CaretLeft size={14} weight="bold" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setSourceIndex((value) => value + 1)}
                  disabled={sources.length <= 1}
                  aria-label="Next source"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition-colors duration-300 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
                >
                  <CaretRight size={14} weight="bold" aria-hidden />
                </button>
              </div>
            </div>

            {currentSource ? (
              <article className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
                <a
                  href={currentSource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-2 text-sm text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition-colors duration-300 hover:text-emerald-700"
                >
                  <LinkSimple size={14} weight="bold" aria-hidden />
                  <span className="break-all">{currentSource.url}</span>
                </a>
              </article>
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
