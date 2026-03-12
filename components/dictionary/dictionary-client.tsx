"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchForm from "@/components/dictionary/search-form";
import ResultPanel from "@/components/dictionary/result-panel";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  NotFoundState,
} from "@/components/dictionary/state-views";
import {
  buildSuggestionTerms,
  DEFAULT_SUGGESTION_COUNT,
  isValidTermInput,
  sanitizeTerm,
} from "@/lib/dictionary";
import type { DictionaryErrorCode, DictionaryResult } from "@/types/dictionary";

type DictionaryClientProps = {
  initialQuery: string;
};

type ViewStatus = "idle" | "loading" | "success" | "not-found" | "error";

const boardStars = [
  { top: "8%", left: "14%", size: 16, duration: "13s", delay: "-2s" },
  { top: "10%", left: "82%", size: 13, duration: "10s", delay: "-4s" },
  { top: "25%", left: "69%", size: 15, duration: "12s", delay: "-1s" },
  { top: "38%", left: "89%", size: 18, duration: "14s", delay: "-6s" },
  { top: "53%", left: "18%", size: 13, duration: "11s", delay: "-3s" },
  { top: "61%", left: "76%", size: 16, duration: "15s", delay: "-5s" },
  { top: "78%", left: "88%", size: 14, duration: "10s", delay: "-7s" },
  { top: "88%", left: "63%", size: 17, duration: "12s", delay: "-2s" },
] as const;

const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

const isDictionaryErrorCode = (value: unknown): value is DictionaryErrorCode =>
  value === "INVALID_TERM" || value === "NOT_FOUND" || value === "UPSTREAM_ERROR";

const readErrorDetails = (
  payload: unknown,
): { code: DictionaryErrorCode | null; message: string | null } => {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { code: null, message: null };
  }

  const messageValue = (payload as { message?: unknown }).message;
  const codeValue = (payload as { code?: unknown }).code;
  const message =
    typeof messageValue === "string" && messageValue.trim().length > 0
      ? messageValue.trim()
      : null;

  return {
    code: isDictionaryErrorCode(codeValue) ? codeValue : null,
    message,
  };
};

class LookupError extends Error {
  constructor(
    message: string,
    readonly code: DictionaryErrorCode | null = null,
  ) {
    super(message);
    this.name = "LookupError";
  }
}

const readSuggestionWords = (payload: unknown) => {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return [];
  }

  const wordsValue = (payload as { words?: unknown }).words;
  if (!Array.isArray(wordsValue)) {
    return [];
  }

  return wordsValue.filter((item): item is string => typeof item === "string");
};

export default function DictionaryClient({ initialQuery }: DictionaryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const [isNavigating, startNavigationTransition] = useTransition();

  const searchParamsString = searchParams.toString();
  const currentQuery = useMemo(() => {
    const params = new URLSearchParams(searchParamsString);
    return sanitizeTerm(params.get("q") ?? "");
  }, [searchParamsString]);

  const [inputValue, setInputValue] = useState(initialQuery);
  const [status, setStatus] = useState<ViewStatus>(initialQuery ? "loading" : "idle");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>(() =>
    buildSuggestionTerms({
      excludeTerms: initialQuery ? [initialQuery] : [],
      count: DEFAULT_SUGGESTION_COUNT,
    }),
  );

  const controllerRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const suggestionControllerRef = useRef<AbortController | null>(null);
  const suggestionRequestIdRef = useRef(0);
  const initialSuggestionExcludeRef = useRef(initialQuery);

  const panelTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.24, ease: MOTION_EASE };
  const isBusy = status === "loading" || isNavigating;
  const isSuccessView = status === "success" && result !== null;

  const replaceQuery = useCallback(
    (nextParams: URLSearchParams) => {
      const nextQueryString = nextParams.toString();
      startNavigationTransition(() => {
        router.replace(nextQueryString ? `/?${nextQueryString}` : "/", {
          scroll: false,
        });
      });
    },
    [router, startNavigationTransition],
  );

  const refreshSuggestions = useCallback(async (excludeTerm?: string) => {
    suggestionControllerRef.current?.abort();

    const controller = new AbortController();
    const requestId = suggestionRequestIdRef.current + 1;
    suggestionRequestIdRef.current = requestId;
    suggestionControllerRef.current = controller;

    try {
      const params = new URLSearchParams({
        count: String(DEFAULT_SUGGESTION_COUNT),
      });
      const sanitizedExclude = sanitizeTerm(excludeTerm ?? "");

      if (sanitizedExclude) {
        params.set("exclude", sanitizedExclude);
      }

      const response = await fetch(`/api/random-words?${params.toString()}`, {
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to load random suggestions.");
      }

      const payload: unknown = await response.json().catch(() => null);
      const nextSuggestions = buildSuggestionTerms({
        preferredTerms: readSuggestionWords(payload),
        excludeTerms: sanitizedExclude ? [sanitizedExclude] : [],
        count: DEFAULT_SUGGESTION_COUNT,
      });

      if (suggestionRequestIdRef.current !== requestId) {
        return;
      }

      setSuggestions(nextSuggestions);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    } finally {
      if (suggestionControllerRef.current === controller) {
        suggestionControllerRef.current = null;
      }
    }
  }, []);

  const lookupWord = useCallback(async (term: string) => {
    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    setStatus("loading");
    setRequestError(null);
    setAudioError(null);

    try {
      const response = await fetch(`/api/dictionary?term=${encodeURIComponent(term)}`, {
        cache: "no-store",
        signal: controller.signal,
      });

      const payload: unknown = await response.json().catch(() => null);
      const { code, message } = readErrorDetails(payload);

      if (!response.ok) {
        const fallbackMessage =
          response.status === 404
            ? `No entry found for "${term}". Try a nearby spelling or a different form of the word.`
            : response.status === 400
              ? "Use letters, spaces, apostrophes, or hyphens only."
              : "Dictionary service is unavailable right now.";
        throw new LookupError(
          code === "NOT_FOUND" ? fallbackMessage : message ?? fallbackMessage,
          code,
        );
      }

      setResult(payload as DictionaryResult);
      setStatus("success");
      void refreshSuggestions(term);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      const lookupError =
        error instanceof LookupError
          ? error
          : new LookupError(
              error instanceof Error
                ? error.message
                : "Unexpected lookup error. Please try again.",
            );

      setResult(null);
      setRequestError(lookupError.message);
      setStatus(lookupError.code === "NOT_FOUND" ? "not-found" : "error");
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    }
  }, [refreshSuggestions]);

  const lookupTermImmediately = useCallback(
    (rawTerm: string) => {
      const nextTerm = sanitizeTerm(rawTerm);

      if (!nextTerm || !isValidTermInput(nextTerm)) {
        return;
      }

      setInputValue(nextTerm);
      setFieldError(null);
      setRequestError(null);
      setAudioError(null);

      if (nextTerm === currentQuery) {
        void lookupWord(nextTerm);
        return;
      }

      const nextParams = new URLSearchParams(searchParamsString);
      nextParams.set("q", nextTerm);
      replaceQuery(nextParams);
    },
    [currentQuery, lookupWord, replaceQuery, searchParamsString],
  );

  useEffect(() => {
    if (!currentQuery) {
      controllerRef.current?.abort();
      setStatus("idle");
      setResult(null);
      setRequestError(null);
      setAudioError(null);
      return;
    }

    setInputValue(currentQuery);

    if (!isValidTermInput(currentQuery)) {
      controllerRef.current?.abort();
      setFieldError("Use letters, spaces, apostrophes, or hyphens only.");
      setStatus("idle");
      setResult(null);
      setRequestError(null);
      setAudioError(null);
      return;
    }

    void lookupWord(currentQuery);
  }, [currentQuery, lookupWord]);

  useEffect(() => {
    const debounceId = window.setTimeout(() => {
      const term = sanitizeTerm(inputValue);

      if (!term) {
        setFieldError(null);

        if (currentQuery) {
          const nextParams = new URLSearchParams(searchParamsString);
          nextParams.delete("q");
          replaceQuery(nextParams);
        }

        return;
      }

      if (!isValidTermInput(term)) {
        setFieldError("Use letters, spaces, apostrophes, or hyphens only.");
        return;
      }

      setFieldError(null);

      if (term === currentQuery) {
        return;
      }

      const nextParams = new URLSearchParams(searchParamsString);
      nextParams.set("q", term);
      replaceQuery(nextParams);
    }, sanitizeTerm(inputValue) ? 320 : 0);

    return () => {
      window.clearTimeout(debounceId);
    };
  }, [currentQuery, inputValue, replaceQuery, searchParamsString]);

  useEffect(() => {
    void refreshSuggestions(initialSuggestionExcludeRef.current);
  }, [refreshSuggestions]);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      suggestionControllerRef.current?.abort();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleValueChange = useCallback((value: string) => {
    const nextValue = value;
    const nextTerm = sanitizeTerm(nextValue);

    setInputValue(nextValue);
    setFieldError(null);
    setRequestError(null);
    setAudioError(null);

    if (!nextTerm) {
      controllerRef.current?.abort();
      setStatus("idle");
      setResult(null);
    }
  }, []);

  const handleSuggestionSelect = useCallback((term: string) => {
    setInputValue(term);
    setFieldError(null);
    setRequestError(null);
    setAudioError(null);
  }, []);

  const handleClear = useCallback(() => {
    controllerRef.current?.abort();
    setInputValue("");
    setStatus("idle");
    setResult(null);
    setFieldError(null);
    setRequestError(null);
    setAudioError(null);
  }, []);

  const handleRetry = useCallback(() => {
    if (currentQuery) {
      void lookupWord(currentQuery);
    }
  }, [currentQuery, lookupWord]);

  const handlePlayAudio = useCallback((audioUrl: string) => {
    setAudioError(null);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const nextAudio = new Audio(audioUrl);
    audioRef.current = nextAudio;

    void nextAudio.play().catch(() => {
      setAudioError(
        "Audio playback was blocked by the browser. Turn on sound permissions and try again.",
      );
    });
  }, []);

  const liveMessage = useMemo(() => {
    if (status === "loading") {
      return currentQuery ? `Searching dictionary for ${currentQuery}.` : "Searching dictionary.";
    }

    if (status === "error" && requestError) {
      return requestError;
    }

    if (status === "not-found" && requestError) {
      return requestError;
    }

    if (status === "success" && result) {
      if (audioError) {
        return audioError;
      }

      return `Loaded ${result.entries.length} definition groups for ${result.term}.`;
    }

    return "Waiting for a search term.";
  }, [audioError, currentQuery, requestError, result, status]);

  return (
    <section
      aria-busy={isBusy}
      className="board-shell relative flex min-h-full flex-col rounded-[2rem] p-5 sm:p-6 md:rounded-[2.4rem] md:p-7"
    >
      <div className="board-starfield absolute inset-0" aria-hidden>
        {boardStars.map((star, index) => (
          <span
            key={`${star.top}-${star.left}-${index}`}
            className="board-star-shell"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              "--star-duration": star.duration,
              "--star-delay": star.delay,
            } as CSSProperties}
          >
            <span className="board-star" />
          </span>
        ))}
      </div>

      <div className="relative z-[1] flex flex-col gap-5">
        <header className="space-y-2">
          <h2 className="board-title text-[clamp(2.4rem,5vw,4rem)] leading-[0.94] text-balance">
            Free Dictionary
          </h2>
          <p className="board-copy max-w-[42ch] text-sm leading-relaxed">
            Pronunciation, definitions, and sources in one playful board.
          </p>
        </header>

        <SearchForm
          value={inputValue}
          isLoading={isBusy}
          showSuggestions={Boolean(sanitizeTerm(inputValue)) && status !== "not-found"}
          fieldError={fieldError}
          suggestions={suggestions}
          onClear={handleClear}
          onSuggestionSelect={handleSuggestionSelect}
          onValueChange={handleValueChange}
        />

        <p aria-live="polite" className="sr-only">
          {liveMessage}
        </p>

        <div className={isSuccessView ? "pt-1" : "min-h-0 flex-1 pt-1"}>
          <AnimatePresence mode="wait">
            {status === "idle" ? (
              <motion.div
                key="idle"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={panelTransition}
                className="h-full"
              >
                <EmptyState
                  suggestions={suggestions}
                  onSuggestionSelect={handleSuggestionSelect}
                />
              </motion.div>
            ) : null}

            {status === "loading" ? (
              <motion.div
                key="loading"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={panelTransition}
                className="h-full"
              >
                <LoadingState query={currentQuery} />
              </motion.div>
            ) : null}

            {status === "not-found" ? (
              <motion.div
                key="not-found"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={panelTransition}
                className="h-full"
              >
                <NotFoundState
                  query={currentQuery || inputValue}
                />
              </motion.div>
            ) : null}

            {status === "error" ? (
              <motion.div
                key="error"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={panelTransition}
                className="h-full"
              >
                <ErrorState
                  message={requestError ?? "Could not load dictionary data."}
                  onRetry={handleRetry}
                />
              </motion.div>
            ) : null}

            {status === "success" && result ? (
              <motion.div
                key={`result-${result.term}`}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={panelTransition}
                className="w-full"
              >
                <ResultPanel
                  result={result}
                  audioError={audioError}
                  onPlayAudio={handlePlayAudio}
                  onTermSelect={lookupTermImmediately}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
