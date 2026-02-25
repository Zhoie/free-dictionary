import {
  LinkSimple,
  Quotes,
  SpeakerHigh,
  SpeakerSlash,
} from "@phosphor-icons/react";
import { motion, type Variants } from "framer-motion";
import type { DictionaryResult } from "@/types/dictionary";

type ResultPanelProps = {
  result: DictionaryResult;
  onPlayAudio: (audioUrl: string) => void;
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
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

const uniqueStrings = (values: string[]) => [...new Set(values)];

export default function ResultPanel({ result, onPlayAudio }: ResultPanelProps) {
  const primaryEntry = result.entries[0];
  const titlePhonetic = primaryEntry?.phonetics.find((item) => item.text)?.text;
  const sources = uniqueStrings(
    result.entries.flatMap((entry) => entry.sourceUrls).filter(Boolean),
  );

  return (
    <motion.section
      layout
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.header
        layout
        layoutId={`dictionary-word-${result.term}`}
        variants={itemVariants}
        className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-6"
      >
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
          Current Word
        </p>
        <h2 className="mt-2 wrap-break-word text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          {primaryEntry.word}
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          {titlePhonetic ?? "No phonetic notation available."}
        </p>
      </motion.header>

      <motion.section
        layout
        variants={itemVariants}
        className="rounded-3xl border border-zinc-200 bg-white p-6"
      >
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-600">
          Pronunciation
        </h3>
        <div className="mt-4 space-y-3">
          {primaryEntry.phonetics.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Audio pronunciation is not available for this term.
            </p>
          ) : (
            primaryEntry.phonetics.map((phonetic, index) => {
              const hasAudio = Boolean(phonetic.audio);

              return (
                <div
                  key={`${phonetic.text ?? "phonetic"}-${index}`}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-3 sm:flex-nowrap"
                >
                  <p className="w-full text-sm text-zinc-700 sm:w-auto">
                    {phonetic.text ?? "Pronunciation variant"}
                  </p>
                  <button
                    type="button"
                    disabled={!hasAudio}
                    onClick={() => {
                      if (phonetic.audio) {
                        onPlayAudio(phonetic.audio);
                      }
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-3 py-1 text-sm font-medium text-zinc-700 transition duration-300 hover:bg-zinc-100 active:scale-[0.98] sm:w-auto sm:justify-start disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
                    aria-label={
                      hasAudio
                        ? `Play pronunciation ${index + 1}`
                        : `Pronunciation ${index + 1} unavailable`
                    }
                  >
                    {hasAudio ? (
                      <SpeakerHigh size={16} weight="fill" aria-hidden />
                    ) : (
                      <SpeakerSlash size={16} weight="fill" aria-hidden />
                    )}
                    {hasAudio ? "Play" : "Unavailable"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </motion.section>

      <div className="space-y-6">
        {result.entries.map((entry, entryIndex) => (
          <motion.section
            key={`${entry.word}-${entryIndex}`}
            layout
            variants={itemVariants}
            className="rounded-3xl border border-zinc-200 bg-white p-6"
          >
            <div className="space-y-6">
              {entry.meanings.map((meaning, meaningIndex) => (
                <article
                  key={`${meaning.partOfSpeech}-${meaningIndex}`}
                  className="space-y-4 border-t border-zinc-100 pt-6 first:border-t-0 first:pt-0"
                >
                  <p className="w-fit rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600">
                    {meaning.partOfSpeech}
                  </p>

                  <ol className="space-y-3">
                    {meaning.definitions.map((definition, definitionIndex) => (
                      <li
                        key={`${definition.definition}-${definitionIndex}`}
                        className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 text-sm leading-relaxed text-zinc-700"
                      >
                        <p>{definition.definition}</p>
                        {definition.example ? (
                          <p className="mt-3 flex items-start gap-2 border-l-2 border-emerald-200 pl-3 text-zinc-600">
                            <Quotes
                              size={14}
                              weight="bold"
                              aria-hidden
                              className="mt-0.5 shrink-0"
                            />
                            <span className="wrap-break-word">{definition.example}</span>
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          </motion.section>
        ))}
      </div>

      {sources.length > 0 ? (
        <motion.section
          layout
          variants={itemVariants}
          className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-6"
        >
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-600">
            Sources
          </h3>
          <ul className="mt-3 space-y-2">
            {sources.map((source) => (
              <li key={source} className="min-w-0">
                <a
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-w-0 items-start gap-2 break-all text-sm text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition-colors duration-300 hover:text-emerald-700"
                >
                  <LinkSimple size={14} weight="bold" aria-hidden />
                  {source}
                </a>
              </li>
            ))}
          </ul>
        </motion.section>
      ) : null}
    </motion.section>
  );
}
