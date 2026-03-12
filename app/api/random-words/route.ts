import { NextResponse } from "next/server";
import {
  FALLBACK_SUGGESTION_TERMS,
  buildSuggestionTerms,
  DEFAULT_SUGGESTION_COUNT,
  normalizeDictionaryResult,
  sanitizeTerm,
} from "@/lib/dictionary";

const DICTIONARY_BASE_URL = "https://api.dictionaryapi.dev/api/v2/entries/en";
const RANDOM_WORDS_UPSTREAM_URL = "https://random-word-api.herokuapp.com/word";
const verifiedWordCache = new Set<string>(FALLBACK_SUGGESTION_TERMS);
const rejectedWordCache = new Set<string>();

const clampSuggestionCount = (value: string | null) => {
  const parsed = Number.parseInt(value ?? "", 10);

  if (Number.isNaN(parsed)) {
    return DEFAULT_SUGGESTION_COUNT;
  }

  return Math.max(1, Math.min(parsed, DEFAULT_SUGGESTION_COUNT));
};

const readWordList = (payload: unknown) => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.filter((item): item is string => typeof item === "string");
};

const hasUsableDictionaryEntry = async (term: string) => {
  try {
    const response = await fetch(`${DICTIONARY_BASE_URL}/${encodeURIComponent(term)}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return false;
    }

    const payload = await response.json().catch(() => null);
    normalizeDictionaryResult(term, payload);
    return true;
  } catch {
    return false;
  }
};

const validateCandidateTerm = async (term: string) => {
  if (verifiedWordCache.has(term)) {
    return true;
  }

  if (rejectedWordCache.has(term)) {
    return false;
  }

  const isUsable = await hasUsableDictionaryEntry(term);

  if (isUsable) {
    verifiedWordCache.add(term);
    return true;
  }

  rejectedWordCache.add(term);
  return false;
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const count = clampSuggestionCount(requestUrl.searchParams.get("count"));
  const exclude = sanitizeTerm(requestUrl.searchParams.get("exclude") ?? "");
  const excludeTerms = exclude ? [exclude] : [];
  const verifiedTerms: string[] = [];
  const maxChecks = Math.max(count * 2, 8);

  try {
    const upstreamResponse = await fetch(
      `${RANDOM_WORDS_UPSTREAM_URL}?number=${maxChecks}`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (upstreamResponse.ok) {
      const upstreamPayload = await upstreamResponse.json().catch(() => null);
      const candidateTerms = buildSuggestionTerms({
        preferredTerms: readWordList(upstreamPayload),
        fallbackTerms: [],
        excludeTerms,
        count: maxChecks,
      });

      for (const term of candidateTerms) {
        if (verifiedTerms.length >= count) {
          break;
        }

        if (await validateCandidateTerm(term)) {
          verifiedTerms.push(term);
        }
      }
    }
  } catch {
    // Ignore upstream failures and use the verified fallback pool below.
  }

  return NextResponse.json(
    {
      words: buildSuggestionTerms({
        preferredTerms: [...verifiedTerms, ...verifiedWordCache],
        fallbackTerms: [],
        excludeTerms,
        count,
      }),
    },
    { status: 200 },
  );
}
