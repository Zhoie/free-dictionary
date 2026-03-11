import { NextResponse } from "next/server";
import {
  extractUpstreamErrorMessage,
  isValidTermInput,
  normalizeDictionaryResult,
  sanitizeTerm,
} from "@/lib/dictionary";
import type { DictionaryError } from "@/types/dictionary";

const DICTIONARY_BASE_URL = "https://api.dictionaryapi.dev/api/v2/entries/en";

const jsonError = (error: DictionaryError) =>
  NextResponse.json(error, { status: error.status });

const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const rawTerm = requestUrl.searchParams.get("term") ?? "";
  const term = sanitizeTerm(rawTerm);

  if (!term) {
    return jsonError({
      code: "INVALID_TERM",
      status: 400,
      message: "The term query parameter is required.",
    });
  }

  if (!isValidTermInput(term)) {
    return jsonError({
      code: "INVALID_TERM",
      status: 400,
      message: "Use letters, spaces, apostrophes, or hyphens only.",
    });
  }

  try {
    const upstreamResponse = await fetch(
      `${DICTIONARY_BASE_URL}/${encodeURIComponent(term)}`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (upstreamResponse.status === 404) {
      const notFoundPayload = await readJson(upstreamResponse);
      const upstreamMessage = extractUpstreamErrorMessage(notFoundPayload);
      const fallbackNotFoundMessage = `No entry found for "${term}". Try a nearby spelling or a different form of the word.`;

      return jsonError({
        code: "NOT_FOUND",
        status: 404,
        message:
          upstreamMessage && upstreamMessage.length < 140
            ? upstreamMessage
            : fallbackNotFoundMessage,
      });
    }

    if (!upstreamResponse.ok) {
      return jsonError({
        code: "UPSTREAM_ERROR",
        status: 502,
        message: "Dictionary service is unavailable right now.",
      });
    }

    const upstreamPayload = await readJson(upstreamResponse);
    const normalized = normalizeDictionaryResult(term, upstreamPayload);

    return NextResponse.json(normalized, { status: 200 });
  } catch {
    return jsonError({
      code: "UPSTREAM_ERROR",
      status: 502,
      message: "Could not reach dictionary service.",
    });
  }
}
