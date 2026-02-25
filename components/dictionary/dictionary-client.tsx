"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchForm from "@/components/dictionary/search-form";
import ResultPanel from "@/components/dictionary/result-panel";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/dictionary/state-views";
import { isValidTermInput, sanitizeTerm } from "@/lib/dictionary";
import type { DictionaryResult } from "@/types/dictionary";

type DictionaryClientProps = {
  initialQuery: string;
};

type ViewStatus = "idle" | "loading" | "success" | "error";

const readErrorMessage = (payload: unknown): string | null => {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return null;
  }

  const messageValue = (payload as { message?: unknown }).message;
  if (typeof messageValue !== "string") {
    return null;
  }

  const trimmed = messageValue.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export default function DictionaryClient({ initialQuery }: DictionaryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [result, setResult] = useState<DictionaryResult | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const lookupWord = useCallback(async (term: string) => {
    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    setStatus("loading");
    setRequestError(null);

    try {
      const response = await fetch(`/api/dictionary?term=${encodeURIComponent(term)}`, {
        cache: "no-store",
        signal: controller.signal,
      });

      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const fallbackMessage =
          response.status === 404
            ? `No definitions found for "${term}".`
            : "Dictionary request failed.";
        throw new Error(readErrorMessage(payload) ?? fallbackMessage);
      }

      setResult(payload as DictionaryResult);
      setStatus("success");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setResult(null);
      setRequestError(
        error instanceof Error
          ? error.message
          : "Unexpected lookup error. Please try again.",
      );
      setStatus("error");
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (!currentQuery) {
      controllerRef.current?.abort();
      setStatus("idle");
      setResult(null);
      setRequestError(null);
      return;
    }

    setInputValue(currentQuery);
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
    }, 320);

    return () => {
      window.clearTimeout(debounceId);
    };
  }, [currentQuery, inputValue, replaceQuery, searchParamsString]);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleValueChange = useCallback((value: string) => {
    setInputValue(value);
    setFieldError(null);
  }, []);

  const handleRetry = useCallback(() => {
    if (currentQuery) {
      void lookupWord(currentQuery);
    }
  }, [currentQuery, lookupWord]);

  const handlePlayAudio = useCallback((audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const nextAudio = new Audio(audioUrl);
    audioRef.current = nextAudio;

    void nextAudio.play().catch(() => {
      setRequestError("Audio playback was blocked by the browser.");
    });
  }, []);

  const liveMessage = useMemo(() => {
    if (status === "loading") {
      return currentQuery ? `Searching dictionary for ${currentQuery}.` : "Searching dictionary.";
    }

    if (status === "error" && requestError) {
      return requestError;
    }

    if (status === "success" && result) {
      return `Loaded ${result.entries.length} definition groups for ${result.term}.`;
    }

    return "Waiting for a search term.";
  }, [currentQuery, requestError, result, status]);

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-white/90 p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] before:pointer-events-none before:absolute before:inset-0 before:rounded-[1.95rem] before:border before:border-white/40 before:shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] sm:rounded-[2.5rem] sm:p-6 sm:before:rounded-[2.45rem] md:p-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(31,143,98,0.09),transparent_40%)]" />
      <div className="relative flex flex-col gap-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Lexical Search
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            English Dictionary
          </h2>
        </header>

        <SearchForm
          value={inputValue}
          isLoading={status === "loading" || isNavigating}
          fieldError={fieldError}
          onValueChange={handleValueChange}
        />

        <p aria-live="polite" className="sr-only">
          {liveMessage}
        </p>

        <div className="min-h-[280px] sm:min-h-[320px]">
          <AnimatePresence mode="wait">
            {status === "idle" ? (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              >
                <EmptyState />
              </motion.div>
            ) : null}

            {status === "loading" ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              >
                <LoadingState />
              </motion.div>
            ) : null}

            {status === "error" ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              >
                <ResultPanel result={result} onPlayAudio={handlePlayAudio} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
