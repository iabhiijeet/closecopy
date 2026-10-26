"use client";
import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ArrowRight, RotateCcw, X } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { quizQuestions } from "@/lib/mock-data";
export default function QuizArtifact({
  questions = quizQuestions,
}: {
  questions?: typeof quizQuestions;
}) {
  const id = useId();
  const [index, setIndex] = useState(0),
    [selected, setSelected] = useState<string | null>(null),
    [score, setScore] = useState(0),
    [done, setDone] = useState(false);
  const q = questions[index];
  const answered = selected !== null;
  const correct = Number(selected) === q.correct;
  function choose(v: unknown) {
    if (answered) return;
    const s = String(v);
    setSelected(s);
    if (Number(s) === q.correct) setScore((n) => n + 1);
  }
  return (
    <div className="preview-paper">
      <div className="flex justify-between mb-4">
        <p className="eyebrow">A LITTLE KNOWLEDGE CHECK</p>
        <Badge
          variant="outline"
          className="text-primary border-primary/20 font-mono text-[10px]"
        >
          {score} / {questions.length} correct
        </Badge>
      </div>
      <Progress
        value={done ? 100 : (index / questions.length) * 100}
        aria-label="Quiz progress"
        className="mb-7"
      />
      {done ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <span className="size-14 rounded-full bg-primary/10 text-primary grid place-items-center mx-auto mb-5">
            <Check className="size-6" />
          </span>
          <h3 className="text-2xl tracking-tight">
            You’re making connections.
          </h3>
          <p className="text-muted-foreground text-sm mt-3 mb-6">
            You got {score} of {questions.length} right. Every question is a
            chance to learn.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setIndex(0);
              setSelected(null);
              setScore(0);
              setDone(false);
            }}
          >
            <RotateCcw /> Try again
          </Button>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
          >
            <p className="font-mono text-[10px] text-muted-foreground mb-3">
              QUESTION {index + 1} OF {questions.length}
            </p>
            <h3 className="text-xl sm:text-2xl font-medium tracking-tight max-w-xl mb-6">
              {q.question}
            </h3>
            <RadioGroup
              value={selected ?? ""}
              onValueChange={choose}
              aria-label={q.question}
              className="gap-3"
            >
              {q.options.map((o, i) => {
                const isCorrect = answered && i === q.correct;
                const isWrong = answered && Number(selected) === i && !correct;
                return (
                  <motion.div
                    key={o}
                    animate={isWrong ? { x: [0, -4, 4, -2, 0] } : { x: 0 }}
                    className={
                      "flex items-center gap-3 p-4 border rounded-lg " +
                      (isCorrect
                        ? "border-success/40 bg-success/5"
                        : isWrong
                          ? "border-destructive/40 bg-destructive/5"
                          : "border-border bg-background/30")
                    }
                  >
                    <RadioGroupItem
                      id={id + i}
                      value={String(i)}
                      disabled={answered}
                    />
                    <Label
                      htmlFor={id + i}
                      className="text-xs sm:text-sm flex-1 cursor-pointer font-normal leading-relaxed"
                    >
                      {o}
                    </Label>
                    {isCorrect && <Check className="size-4 text-success" />}
                    {isWrong && <X className="size-4 text-destructive" />}
                  </motion.div>
                );
              })}
            </RadioGroup>
            {answered && (
              <motion.div
                role="status"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5"
              >
                <p
                  className={
                    "text-xs " +
                    (correct ? "text-success" : "text-citation-foreground")
                  }
                >
                  {correct
                    ? "Exactly right. "
                    : "A useful connection to remember: "}
                  {q.explanation}
                </p>
                <Button
                  className="mt-5"
                  onClick={() => {
                    if (index === questions.length - 1) setDone(true);
                    else {
                      setIndex(index + 1);
                      setSelected(null);
                    }
                  }}
                >
                  {index === questions.length - 1
                    ? "See your results"
                    : "Next question"}
                  <ArrowRight />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
