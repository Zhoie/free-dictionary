export interface PhoneticItem {
  text: string | null;
  audio: string | null;
  sourceUrl: string | null;
}

export interface DefinitionItem {
  definition: string;
  example: string | null;
  synonyms: string[];
  antonyms: string[];
}

export interface MeaningItem {
  partOfSpeech: string;
  definitions: DefinitionItem[];
  synonyms: string[];
  antonyms: string[];
}

export interface DictionaryEntry {
  word: string;
  phonetics: PhoneticItem[];
  meanings: MeaningItem[];
  sourceUrls: string[];
}

export interface DictionaryResult {
  term: string;
  entries: DictionaryEntry[];
  fetchedAt: string;
}

export type DictionaryErrorCode = "INVALID_TERM" | "NOT_FOUND" | "UPSTREAM_ERROR";

export interface DictionaryError {
  code: DictionaryErrorCode;
  status: 400 | 404 | 502;
  message: string;
}
