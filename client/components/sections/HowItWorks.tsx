"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  UploadCloud,
  FileText,
  ArrowUpRight,
  Network,
  ListChecks,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Logo from "@/components/landing/Logo";
import SectionHeading from "@/components/landing/SectionHeading";
import Reveal from "@/components/landing/Reveal";
import CitationChip from "@/components/landing/CitationChip";
import { citations } from "@/lib/mock-data";
const steps = [
  {
    title: "Bring your sources.",
    text: "Drop in a PDF, paste a link, or add your notes. Your knowledge finally has a place to live.",
    tag: "A GOOD PLACE TO START",
  },
  {
    title: "Follow your curiosity.",
    text: "Ask a question, compare perspectives, or find the passage you forgot. Every answer points back to the source.",
    tag: "ASK. CONNECT. UNDERSTAND.",
  },
  {
    title: "Make something of it.",
    text: "Choose a format and turn your understanding into something useful. A study guide for you. A report for your team.",
    tag: "FROM INSIGHT TO ARTIFACT",
  },
];
function StepVisual({ step }: { step: number }) {
  return (
    <Card className="glass p-6 sm:p-9 gap-0 min-h-90 justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
        >
          {step === 0 ? (
            <>
              <div className="border border-dashed border-primary/25 rounded-xl p-6 text-center bg-primary/3">
                <UploadCloud className="size-7 text-primary mx-auto mb-4" />
                <p className="text-sm">A new home for your knowledge.</p>
                <p className="text-[10px] mt-2 text-muted-foreground">
                  PDFs, books, docs, links, and little sparks of inspiration.
                </p>
              </div>
              <div className="mt-5 space-y-3">
                {["The Creative Mind.pdf", "My research notes"].map((s, i) => (
                  <motion.div
                    key={s}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.2 }}
                    className="border border-border rounded-lg p-3 bg-background/30"
                  >
                    <div className="flex gap-3 items-center">
                      <FileText className="size-4 text-primary" />
                      <span className="text-[11px] flex-1">{s}</span>
                      <Check className="size-3 text-success" />
                    </div>
                    <Progress
                      value={100}
                      aria-label={s + " indexed"}
                      className="mt-3"
                    />
                  </motion.div>
                ))}
              </div>
            </>
          ) : step === 1 ? (
            <div>
              <Badge
                variant="outline"
                className="mb-5 text-[9px] text-primary border-primary/20"
              >
                SOURCE-GROUNDED CONVERSATION
              </Badge>
              <div className="ml-10 p-4 bg-secondary rounded-xl rounded-tr-sm border border-border text-xs">
                What makes a creative practice work?
              </div>
              <div className="mt-6 flex gap-3">
                <span className="text-primary mt-1">
                  <Logo markOnly markClassName="size-6" />
                </span>
                <div>
                  <p className="text-xs mb-3 font-medium">
                    Your sources point to a simple framework.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Collect observations. Connect patterns. Test small ideas.
                    Repeat with intention.
                  </p>
                  <div className="flex gap-2 mt-4">
                    <CitationChip citation={citations[0]} />
                    <CitationChip citation={citations[1]} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="eyebrow mb-5">ONE QUESTION. NEW POSSIBILITIES.</p>
              {[
                {
                  name: "Your chapter, distilled",
                  sub: "Summary · 3 key ideas",
                  Icon: FileText,
                },
                {
                  name: "A little knowledge check",
                  sub: "Quiz · 3 questions",
                  Icon: ListChecks,
                },
                {
                  name: "The bigger picture",
                  sub: "Mind map · 6 concepts",
                  Icon: Network,
                },
              ].map(({ name, sub, Icon }, i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.18 }}
                  className="flex gap-4 items-center bg-background/40 border border-border rounded-xl p-4 mb-3"
                >
                  <span className="source-icon">
                    <Icon className="size-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-medium">{name}</p>
                    <p className="text-[9px] text-muted-foreground mt-1">
                      {sub}
                    </p>
                  </div>
                  <ArrowUpRight className="size-4 text-primary" />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Card>
  );
}
export default function HowItWorks() {
  const [step, setStep] = useState(0);
  return (
    <section
      id="how-it-works"
      className="section-space border-y border-border bg-card/30"
    >
      <div className="container-page">
        <SectionHeading
          eyebrow="FROM OPEN TAB TO OPEN POSSIBILITY"
          title={
            <>
              Three small steps.
              <br />A whole new way to{" "}
              <span className="serif text-primary">work.</span>
            </>
          }
        />
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-18">
          <div className="space-y-3">
            {steps.map((s, i) => (
              <button
                type="button"
                key={s.title}
                onClick={() => setStep(i)}
                aria-pressed={step === i}
                className={
                  "flex w-full gap-5 rounded-xl border p-5 text-left transition-colors duration-200 " +
                  (step === i
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card hover:border-primary/25")
                }
              >
                <span
                  className={
                    "relative z-1 size-10 rounded-full border flex items-center justify-center shrink-0 text-xs font-mono " +
                    (step === i
                      ? "border-primary/40 bg-secondary text-primary"
                      : "border-border bg-background text-muted-foreground")
                  }
                >
                  0{i + 1}
                </span>
                <div className="pt-1">
                  <p className="eyebrow text-[8px] mb-3">{s.tag}</p>
                  <h3 className="text-xl sm:text-2xl tracking-tight mb-3 font-medium">
                    {s.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-85">
                    {s.text}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <div className="lg:sticky lg:top-28">
            <Reveal>
              <StepVisual step={step} />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
