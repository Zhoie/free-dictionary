import type {
  DefinitionItem,
  DictionaryEntry,
  DictionaryResult,
  MeaningItem,
  PhoneticItem,
} from "@/types/dictionary";

const TERM_PATTERN = /^[a-zA-Z][a-zA-Z\s'-]*$/;

export const DEFAULT_SUGGESTION_COUNT = 4;

// Curated common words used when the random-word pipeline cannot verify enough terms.
export const FALLBACK_SUGGESTION_TERMS = [
  "cadence",
  "lucid",
  "threshold",
  "harbor",
  "meadow",
  "lantern",
  "echo",
  "cinder",
  "marble",
  "ripple",
  "glimmer",
  "anchor",
  "brisk",
  "cobalt",
  "drift",
  "hollow",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readText = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const readStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => readText(item))
    .filter((item): item is string => item !== null);
};

export const sanitizeTerm = (input: string) =>
  input.trim().toLowerCase().replace(/\s+/g, " ");

export const isValidTermInput = (term: string) => TERM_PATTERN.test(term);

export const buildSuggestionTerms = ({
  preferredTerms = [],
  fallbackTerms = FALLBACK_SUGGESTION_TERMS,
  excludeTerms = [],
  count = DEFAULT_SUGGESTION_COUNT,
}: {
  preferredTerms?: readonly string[];
  fallbackTerms?: readonly string[];
  excludeTerms?: readonly string[];
  count?: number;
}) => {
  const limit = Math.max(1, count);
  const excluded = new Set(
    excludeTerms
      .map((term) => sanitizeTerm(term))
      .filter((term) => term.length > 0),
  );
  const nextTerms: string[] = [];
  const seen = new Set<string>();

  const pushTerm = (value: string) => {
    const term = sanitizeTerm(value);

    if (!term || !isValidTermInput(term) || excluded.has(term) || seen.has(term)) {
      return;
    }

    seen.add(term);
    nextTerms.push(term);
  };

  preferredTerms.forEach(pushTerm);
  fallbackTerms.forEach(pushTerm);

  return nextTerms.slice(0, limit);
};

const normalizePhonetic = (value: unknown): PhoneticItem | null => {
  if (!isRecord(value)) {
    return null;
  }

  const text = readText(value.text);
  const audio = readText(value.audio);
  const sourceUrl = readText(value.sourceUrl);

  if (!text && !audio) {
    return null;
  }

  return {
    text,
    audio,
    sourceUrl,
  };
};

const normalizeDefinition = (value: unknown): DefinitionItem | null => {
  if (!isRecord(value)) {
    return null;
  }

  const definition = readText(value.definition);
  if (!definition) {
    return null;
  }

  return {
    definition,
    example: readText(value.example),
    synonyms: readStringArray(value.synonyms),
    antonyms: readStringArray(value.antonyms),
  };
};

const normalizeMeaning = (value: unknown): MeaningItem | null => {
  if (!isRecord(value)) {
    return null;
  }

  const definitions = Array.isArray(value.definitions)
    ? value.definitions
        .map((item) => normalizeDefinition(item))
        .filter((item): item is DefinitionItem => item !== null)
    : [];

  if (definitions.length === 0) {
    return null;
  }

  return {
    partOfSpeech: readText(value.partOfSpeech) ?? "unknown",
    definitions,
    synonyms: readStringArray(value.synonyms),
    antonyms: readStringArray(value.antonyms),
  };
};

const normalizeEntry = (
  value: unknown,
  fallbackTerm: string,
): DictionaryEntry | null => {
  if (!isRecord(value)) {
    return null;
  }

  const meanings = Array.isArray(value.meanings)
    ? value.meanings
        .map((item) => normalizeMeaning(item))
        .filter((item): item is MeaningItem => item !== null)
    : [];

  if (meanings.length === 0) {
    return null;
  }

  const phonetics = Array.isArray(value.phonetics)
    ? value.phonetics
        .map((item) => normalizePhonetic(item))
        .filter((item): item is PhoneticItem => item !== null)
    : [];

  const sourceUrls = readStringArray(value.sourceUrls);
  const sourceUrlSingle = readText(value.sourceURL);

  return {
    word: readText(value.word) ?? fallbackTerm,
    phonetics,
    meanings,
    sourceUrls:
      sourceUrlSingle && !sourceUrls.includes(sourceUrlSingle)
        ? [...sourceUrls, sourceUrlSingle]
        : sourceUrls,
  };
};

export const normalizeDictionaryResult = (
  term: string,
  payload: unknown,
): DictionaryResult => {
  if (!Array.isArray(payload)) {
    throw new Error("Unexpected dictionary response format.");
  }

  const entries = payload
    .map((item) => normalizeEntry(item, term))
    .filter((item): item is DictionaryEntry => item !== null);

  if (entries.length === 0) {
    throw new Error("No usable definitions were returned.");
  }

  return {
    term,
    entries,
    fetchedAt: new Date().toISOString(),
  };
};

export const extractUpstreamErrorMessage = (payload: unknown): string | null => {
  if (!isRecord(payload)) {
    return null;
  }

  const title = readText(payload.title);
  const message = readText(payload.message);
  const resolution = readText(payload.resolution);

  return [title, message, resolution].filter(Boolean).join(" ").trim() || null;
};
