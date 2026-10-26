"use client";
import { useReducedMotionPreference as useReducedMotion } from "@/components/landing/useReducedMotionPreference";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import {
  ArrowUp,
  ChevronDown,
  FileText,
  ListChecks,
  Network,
  Plus,
  Sparkles,
  PanelLeft,
  MoreHorizontal,
  Play,
  Pause,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { citations, chatScripts } from "@/lib/mock-data";
import Logo from "./Logo";
import SourceList from "./SourceList";
import Typewriter from "./Typewriter";
import CitationChip from "./CitationChip";
import Shimmer from "./Shimmer";
export default function HeroWorkspace() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(true);
  useEffect(() => {
    if (reduce || paused || !inView) return;
    const t = setInterval(() => setTick((v) => (v + 1) % 20), 1000);
    return () => clearInterval(t);
  }, [reduce, paused, inView]);
  const stage = reduce || paused ? 18 : tick;
  return (
    <Card
      ref={ref}
      className="relative bg-card p-0 gap-0 rounded-xl border border-border"
    >
      <div className="h-11 px-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex gap-1.5" aria-hidden="true">
            <span className="size-2 rounded-full bg-foreground/15" />
            <span className="size-2 rounded-full bg-foreground/15" />
            <span className="size-2 rounded-full bg-foreground/15" />
          </div>
          <Separator orientation="vertical" className="h-4 hidden sm:block" />
          <span className="text-[10px] text-muted-foreground flex items-center gap-2">
            <Logo markOnly className="scale-65 -mr-1" /> My workspace{" "}
            <span className="text-foreground/20">/</span>
            <span className="text-foreground/80">Creative thinking</span>
            <ChevronDown className="size-3" />
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-[8px] h-4 text-muted-foreground"
          >
            LIVE DEMO
          </Badge>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setPaused(!paused)}
            aria-label={paused ? "Play workspace demo" : "Pause workspace demo"}
          >
            {paused ? (
              <Play className="size-3" />
            ) : (
              <Pause className="size-3" />
            )}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[215px_1fr_230px] lg:grid-cols-[230px_1fr_245px] min-h-87">
        <div className="hidden md:block border-r border-border p-4">
          <div className="flex justify-between mb-5 items-center">
            <span className="app-label flex items-center gap-2">
              <PanelLeft className="size-3" /> Sources{" "}
              <span className="text-foreground/70">03</span>
            </span>
            <Plus className="size-3 text-muted-foreground" />
          </div>
          <SourceList stage={stage} />
          <div className="mt-5 border-t border-border pt-3 flex items-center gap-1.5 text-[9px] text-muted-foreground">
            <span className="size-1 rounded-full bg-success" /> Your knowledge,
            all connected
          </div>
        </div>
        <div className="flex flex-col min-w-0">
          <div className="px-5 pt-4 flex justify-between items-center">
            <span className="app-label flex items-center gap-2">
              <Sparkles className="size-3 text-primary" /> Source-grounded chat
            </span>
            <MoreHorizontal className="size-4 text-muted-foreground" />
          </div>
          <ScrollArea className="h-67">
            <div className="p-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={stage === 0 ? "reset" : "chat"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {stage >= 3 ? (
                    <>
                      <div className="flex justify-end mb-5 gap-2 items-start">
                        <div className="rounded-xl rounded-tr-sm bg-secondary border border-border px-3 py-2 text-[11px] max-w-65 leading-relaxed">
                          <Typewriter
                            key={Math.floor(tick / 20)}
                            text={chatScripts[0].prompt}
                            speed={30}
                          />
                        </div>
                        <Avatar size="sm">
                          <AvatarFallback className="text-[8px]">
                            YO
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex gap-2.5">
                        <span className="size-6 shrink-0 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                          <Logo markOnly markClassName="size-6" />
                        </span>
                        <div className="flex-1">
                          <p className="text-[10px] font-medium mb-2">
                            closecopy{" "}
                            <span className="font-normal text-muted-foreground ml-1.5">
                              · from your sources
                            </span>
                          </p>
                          {stage < 5 ? (
                            <div className="flex gap-1 py-2">
                              {[0, 1, 2].map((i) => (
                                <motion.span
                                  key={i}
                                  className="size-1.5 rounded-full bg-primary"
                                  animate={
                                    reduce
                                      ? undefined
                                      : {
                                          opacity: [0.3, 1, 0.3],
                                          y: [0, -3, 0],
                                        }
                                  }
                                  transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                  }}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="text-[11px] text-foreground/75 leading-[1.9]">
                              <Typewriter
                                text={chatScripts[0].answer}
                                speed={14}
                              />
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {citations.slice(0, 2).map((c) => (
                                  <CitationChip key={c.sourceId} citation={c} />
                                ))}
                              </div>
                              <p className="text-[9px] text-muted-foreground mt-3 flex items-center gap-1">
                                <span className="size-1 rounded-full bg-success" />{" "}
                                Grounded in 3 sources
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="pt-12 text-center">
                      <Sparkles className="size-6 mx-auto text-primary mb-3" />
                      <p className="text-sm">
                        A little curiosity goes a long way.
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-2">
                        Connecting your sources…
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </ScrollArea>
          <div className="mx-4 mb-4 mt-auto border border-border rounded-lg bg-background/50 p-2 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              Ask anything about your sources…
            </span>
            <span className="size-6 rounded-md gradient-button grid place-items-center">
              <ArrowUp className="size-3" />
            </span>
          </div>
        </div>
        <div className="hidden md:block border-l border-border p-4">
          <div className="flex justify-between mb-5 items-center">
            <span className="app-label flex items-center gap-2">
              <Network className="size-3" /> Artifacts
            </span>
            <Badge className="h-4 text-[8px] bg-primary/10 text-primary">
              AI POWERED
            </Badge>
          </div>
          {[
            {
              name: "Chapter summary",
              sub: "The big ideas, distilled.",
              Icon: FileText,
            },
            {
              name: "Test your knowledge",
              sub: "3 questions · quiz",
              Icon: ListChecks,
            },
            {
              name: "Connect the concepts",
              sub: "Mind map · 6 connections",
              Icon: Network,
            },
          ].map(({ name, sub, Icon }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: stage >= 7 + i * 2 ? 1 : 0.35, y: 0 }}
              className="mb-2.5"
            >
              <Card className="p-3 gap-0 bg-background/40 rounded-lg border border-border ring-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="size-6 bg-primary/10 rounded-md text-primary flex items-center justify-center">
                    <Icon className="size-3" />
                  </span>
                  <span className="text-[10px] font-medium">{name}</span>
                  {stage > 8 + i * 2 && <CheckMark />}
                </div>
                {stage <= 8 + i * 2 ? (
                  <Shimmer />
                ) : (
                  <p className="text-[9px] text-muted-foreground ml-8">{sub}</p>
                )}
              </Card>
            </motion.div>
          ))}
          <a
            href="#artifacts"
            className="text-[9px] text-primary mt-4 flex items-center justify-center gap-1.5"
          >
            <Plus className="size-3" /> Generate an artifact
          </a>
        </div>
      </div>
    </Card>
  );
}
function CheckMark() {
  return <span className="ml-auto text-[8px] text-success">✓</span>;
}
