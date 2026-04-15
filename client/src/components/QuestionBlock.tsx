/**
 * QuestionBlock.tsx
 * Renders a structured Maya question block with chip-style options.
 *
 * Backend sends `questionBlocks: Array<{ question, multi, options }>` for
 * a single assistant message. The user must answer every block before the
 * aggregated answer is submitted via onSubmitAll. For single-answer blocks
 * a click selects the option (without sending); for multi-answer blocks
 * clicks toggle membership. Text-type options render an inline input.
 *
 * The container also renders a gold "Envoyer" button that becomes enabled
 * only when every question has at least one answer — then it calls
 * onSubmitAll(combinedString) where combinedString is formatted as :
 *   "Question 1 : answer1 | Question 2 : answer2a, answer2b"
 */
import { useMemo, useState } from "react";

export interface QuestionOption {
  label: string;
  type: "button" | "text";
  placeholder?: string;
}

export interface QuestionBlockData {
  question: string;
  multi: boolean;
  options: QuestionOption[];
}

interface QuestionBlockGroupProps {
  blocks: QuestionBlockData[];
  onSubmitAll: (combined: string) => void;
  disabled?: boolean;
}

/**
 * Group component — renders all question_blocks for a single message and
 * manages the combined submission state.
 */
export default function QuestionBlockGroup({
  blocks,
  onSubmitAll,
  disabled,
}: QuestionBlockGroupProps) {
  // answers[blockIndex] = Set of selected button labels
  // textAnswers[blockIndex] = free-text value (if the user typed in a text option)
  const [answers, setAnswers] = useState<Record<number, Set<string>>>(() => {
    const init: Record<number, Set<string>> = {};
    blocks.forEach((_, i) => (init[i] = new Set()));
    return init;
  });
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});

  const toggle = (blockIdx: number, label: string, multi: boolean) => {
    setAnswers((prev) => {
      const current = new Set(prev[blockIdx] || []);
      if (current.has(label)) {
        current.delete(label);
      } else {
        if (!multi) current.clear();
        current.add(label);
      }
      return { ...prev, [blockIdx]: current };
    });
  };

  const setTextValue = (blockIdx: number, value: string) => {
    setTextAnswers((prev) => ({ ...prev, [blockIdx]: value }));
  };

  // A block is "answered" when either a button is selected OR a non-empty text is typed
  const isBlockAnswered = (idx: number): boolean => {
    const buttons = answers[idx];
    const text = (textAnswers[idx] || "").trim();
    return (!!buttons && buttons.size > 0) || text.length > 0;
  };

  const allAnswered = useMemo(
    () => blocks.every((_, i) => isBlockAnswered(i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blocks, answers, textAnswers]
  );

  const handleSubmit = () => {
    if (!allAnswered || disabled) return;
    // BUG FIX : send only the answers, never the question text.
    // Format : "Ce soir | En couple | Rooftop, Festif"
    const parts: string[] = [];
    blocks.forEach((_, i) => {
      const buttonParts = Array.from(answers[i] || []);
      const text = (textAnswers[i] || "").trim();
      const segments = [...buttonParts];
      if (text.length > 0) segments.push(text);
      if (segments.length > 0) {
        parts.push(segments.join(", "));
      }
    });
    if (parts.length > 0) onSubmitAll(parts.join(" | "));
  };

  return (
    <div
      className="mt-3 space-y-4"
      style={{
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? "none" : "auto",
        transition: "opacity 300ms",
      }}
    >
      {blocks.map((block, idx) => {
        const selected = answers[idx] || new Set();
        const textVal = textAnswers[idx] || "";
        return (
          <div
            key={idx}
            className="rounded-xl p-3"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(200,169,110,0.15)",
            }}
          >
            <p
              className="mb-2 text-sm font-medium"
              style={{ color: "#F0EDE6" }}
            >
              {block.question}
            </p>
            <div className="flex flex-wrap gap-2">
              {block.options
                .filter((o) => o.type === "button")
                .map((opt, oi) => {
                  const isSel = selected.has(opt.label);
                  return (
                    <button
                      key={`${opt.label}-${oi}`}
                      type="button"
                      onClick={() => toggle(idx, opt.label, block.multi)}
                      disabled={disabled}
                      className="rounded-full text-sm transition-all"
                      style={{
                        minHeight: 44,
                        padding: "0 14px",
                        background: isSel
                          ? "linear-gradient(135deg, #C8A96E, #E8D5A8)"
                          : "rgba(255,255,255,0.05)",
                        color: isSel ? "#070B14" : "rgba(255,255,255,0.85)",
                        border: isSel
                          ? "1px solid #C8A96E"
                          : "1px solid rgba(200,169,110,0.25)",
                        fontWeight: isSel ? 600 : 400,
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
            </div>
            {block.options.some((o) => o.type === "text") && (
              <div className="mt-3">
                {block.options
                  .filter((o) => o.type === "text")
                  .slice(0, 1)
                  .map((opt, oi) => (
                    <input
                      key={`text-${oi}`}
                      type="text"
                      value={textVal}
                      onChange={(e) => setTextValue(idx, e.target.value)}
                      placeholder={opt.placeholder || opt.label}
                      disabled={disabled}
                      className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                      style={{
                        minHeight: 44,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(200,169,110,0.2)",
                        color: "#F0EDE6",
                      }}
                    />
                  ))}
              </div>
            )}
          </div>
        );
      })}

      {!disabled && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="w-full rounded-xl text-sm font-semibold transition-opacity"
          style={{
            minHeight: 48,
            background: allAnswered
              ? "linear-gradient(135deg, #C8A96E, #E8D5A8)"
              : "rgba(200,169,110,0.15)",
            color: allAnswered ? "#070B14" : "rgba(255,255,255,0.4)",
            cursor: allAnswered ? "pointer" : "not-allowed",
            border: "1px solid rgba(200,169,110,0.3)",
          }}
        >
          Envoyer
        </button>
      )}
    </div>
  );
}
