"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties } from "react";

type SuggestionChipsProps = {
  suggestions: readonly string[];
  onSuggestionSelect: (term: string) => void;
  activeTerm?: string;
  className?: string;
};

const CHIP_EASE = [0.22, 1, 0.36, 1] as const;
const CHIP_STAGGER_MS = 90;

const listMatches = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((term, index) => term === right[index]);

export default function SuggestionChips({
  suggestions,
  onSuggestionSelect,
  activeTerm,
  className = "flex flex-wrap gap-2",
}: SuggestionChipsProps) {
  const shouldReduceMotion = useReducedMotion();
  const [displayedSuggestions, setDisplayedSuggestions] = useState(() => [...suggestions]);
  const displayedSuggestionsRef = useRef(displayedSuggestions);

  useEffect(() => {
    displayedSuggestionsRef.current = displayedSuggestions;
  }, [displayedSuggestions]);

  useEffect(() => {
    const nextSuggestions = [...suggestions];

    if (listMatches(displayedSuggestionsRef.current, nextSuggestions)) {
      return;
    }

    if (shouldReduceMotion) {
      const frameId = window.requestAnimationFrame(() => {
        setDisplayedSuggestions(nextSuggestions);
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    const timeoutIds: number[] = [];

    nextSuggestions.forEach((term, index) => {
      if (displayedSuggestionsRef.current[index] === term) {
        return;
      }

      timeoutIds.push(
        window.setTimeout(() => {
          setDisplayedSuggestions((current) => {
            const updated = [...current];
            updated[index] = term;
            return updated;
          });
        }, index * CHIP_STAGGER_MS),
      );
    });

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [shouldReduceMotion, suggestions]);

  return (
    <motion.div layout className={className}>
      {displayedSuggestions.map((term, index) => {
        const isActive = activeTerm === term;

        return (
          <motion.button
            key={`suggestion-slot-${index}`}
            layout="position"
            type="button"
            onClick={() => onSuggestionSelect(term)}
            data-active={isActive ? "true" : "false"}
            className="toy-surface toy-chip toy-suggestion"
            transition={{
              duration: shouldReduceMotion ? 0 : 0.2,
              ease: CHIP_EASE,
            }}
            style={
              {
                "--toy-rotate": index % 2 === 0 ? "-2deg" : "2deg",
                opacity: isActive ? 1 : 0.94,
              } as CSSProperties
            }
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={term}
                initial={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, y: 10, scale: 0.95 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, y: -8, scale: 0.98 }
                }
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.24,
                  ease: CHIP_EASE,
                }}
              >
                {term}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
