"use client";
import { useReducedMotionPreference as useReducedMotion } from "@/components/landing/useReducedMotionPreference";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, Sparkles, FileText, Network, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import MagneticButton from "@/components/landing/MagneticButton";
import HeroWorkspace from "@/components/landing/HeroWorkspace";
import GradientText from "@/components/landing/GradientText";
export default function Hero() {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0),
    my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 80, damping: 25 }),
    y = useSpring(my, { stiffness: 80, damping: 25 });
  return (
    <section
      id="home"
      className="relative isolate overflow-hidden pt-36 pb-16 sm:pt-40"
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left - r.width / 2) * 0.015);
        my.set((e.clientY - r.top - r.height / 2) * 0.015);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="dot-grid absolute inset-x-0 top-0 h-200 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <motion.div className="aurora-orb absolute -top-40 left-[calc(50%-500px)] w-250 h-190" />
        <motion.div className="aurora-cyan absolute top-45 left-[55%] size-160" />
        <div className="absolute left-1/2 top-25 h-110 w-px bg-linear-to-b from-primary/20 to-transparent -rotate-35" />
      </div>
      <div className="container-page text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Badge
            variant="outline"
            className="relative h-7 sm:h-8 border-primary/20 bg-primary/5 px-3.5 gap-2 text-[9px] sm:text-[10px] font-normal text-foreground/75 overflow-hidden"
          >
            <Sparkles className="text-primary" /> Turn your sources into answers
            & artifacts
          </Badge>
        </motion.div>
        <h1
          aria-label="Your knowledge, put to work."
          className="mt-7 sm:mt-8 text-[42px] sm:text-[66px] lg:text-[76px] leading-[1.08] font-semibold tracking-[-0.065em]"
        >
          <span className="block">
            {["Your", "knowledge,"].map((w, i) => (
              <motion.span
                key={i}
                className="inline-block mr-[.18em] last:mr-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
              >
                {w}
              </motion.span>
            ))}
          </span>
          <span className="block mt-1">
            <motion.span
              className="inline-block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <GradientText className="serif text-[1.16em] tracking-[-0.035em]">
                put to work.
              </GradientText>
            </motion.span>
          </span>
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mx-auto mt-6 max-w-140 text-sm sm:text-base leading-relaxed text-muted-foreground"
        >
          Bring your sources together. Find grounded answers and turn insight
          into something useful.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-7 flex flex-wrap justify-center gap-3"
        >
          <MagneticButton
            render={<a href="#playground" />}
            className="group h-11 text-xs px-5"
          >
            Explore the workspace <ArrowRight className="size-3.5" />
          </MagneticButton>
          <MagneticButton
            tone="outline"
            render={<a href="#how-it-works" />}
            className="h-11 text-xs px-5"
          >
            How it works <ArrowRight className="size-3.5" />
          </MagneticButton>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-5 flex items-center justify-center gap-4 text-[9px] text-muted-foreground"
        >
          <span className="flex gap-1.5 items-center">
            <Check className="size-3 text-primary" /> Free to get started
          </span>
          <span className="size-0.5 bg-muted-foreground rounded-full" />
          <span>No credit card needed</span>
        </motion.div>
        <motion.div
          className="relative mx-auto mt-13 sm:mt-15 max-w-5xl text-left"
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div
            aria-hidden="true"
            className="absolute -inset-0.5 rounded-xl border border-primary/15 bg-card"
          />
          <HeroWorkspace />
          <motion.div
            aria-hidden="true"
            className="absolute -left-13 top-15 hidden xl:block"
            style={{ x, y, rotate: -9 }}
          >
            <Card className="p-3.5 gap-2 bg-popover/95 border border-border shadow-xl w-38">
              <span className="flex gap-2 items-center text-[10px]">
                <FileText className="size-4 text-primary" /> Your next big
                idea.pdf
              </span>
              <div className="h-1 w-26 bg-foreground/10 rounded" />
              <div className="h-1 w-20 bg-foreground/10 rounded" />
              <span className="text-[8px] text-muted-foreground">
                A little knowledge. A lot of possibility.
              </span>
            </Card>
          </motion.div>
          <motion.div
            aria-hidden="true"
            className="absolute -right-11 -bottom-5 hidden xl:block"
            style={{ x, y, rotate: 8 }}
          >
            <Card className="w-37 gap-2 p-3.5 bg-popover/95 border border-primary/20 shadow-xl">
              <span className="text-[10px] flex items-center gap-2">
                <Network className="size-4 text-gold" /> Mind map, made.
              </span>
              <svg viewBox="0 0 120 48" className="w-full h-10">
                <path
                  d="M60 24L22 10M60 24L100 10M60 24L24 40M60 24L99 39"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="1"
                />
                {[
                  [60, 24],
                  [22, 10],
                  [100, 10],
                  [24, 40],
                  [99, 39],
                ].map(([cx, cy], i) => (
                  <circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r={i ? 4 : 6}
                    fill={i ? "var(--secondary)" : "var(--primary)"}
                    stroke="var(--primary)"
                  />
                ))}
              </svg>
            </Card>
          </motion.div>
          <svg
            aria-hidden="true"
            viewBox="0 0 1000 60"
            className="absolute -bottom-15 w-full h-15 opacity-30 pointer-events-none"
          >
            <motion.path
              d="M120 0C120 50 500 60 500 0C500 50 870 60 870 0"
              stroke="var(--primary)"
              fill="none"
              strokeDasharray="3 9"
            />
          </svg>
        </motion.div>
        <div className="mt-10 flex items-center justify-center gap-3">
          <AvatarGroup>
            {["MC", "AP", "JE", "NW"].map((s, i) => (
              <Avatar key={s} className="size-6">
                <AvatarFallback
                  className={
                    i % 2
                      ? "bg-secondary text-[8px] text-primary"
                      : "bg-accent text-[8px] text-primary"
                  }
                >
                  {s}
                </AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
          <p className="text-[10px] text-muted-foreground">
            For curious minds. And the things they make.
          </p>
        </div>
      </div>
    </section>
  );
}
