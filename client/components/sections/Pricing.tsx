"use client";
import { useReducedMotionPreference as useReducedMotion } from "@/components/landing/useReducedMotionPreference";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ArrowUpRight, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import SectionHeading from "@/components/landing/SectionHeading";
import Reveal from "@/components/landing/Reveal";
import { pricing } from "@/lib/mock-data";
export default function Pricing() {
  const [billing, setBilling] = useState("monthly");
  const reduce = useReducedMotion();
  return (
    <section id="pricing" className="section-space">
      <div className="container-page">
        <SectionHeading
          eyebrow="ROOM FOR YOUR NEXT BIG IDEA"
          title={
            <>
              A small investment.
              <br />A lot more{" "}
              <span className="serif text-primary">possibility.</span>
            </>
          }
          description="Start with a little curiosity. Choose more room when you need it."
        />
        <div className="flex justify-center mb-12">
          <ToggleGroup
            value={[billing]}
            onValueChange={(v) => {
              if (v[0]) setBilling(v[0]);
            }}
            className="relative rounded-full border border-border bg-card p-1 gap-0"
            aria-label="Billing period"
          >
            {["monthly", "yearly"].map((v) => (
              <ToggleGroupItem
                key={v}
                value={v}
                className="relative rounded-full h-8 text-[11px] px-5 data-pressed:bg-transparent"
              >
                <span className="relative z-1 flex items-center gap-2">
                  {v === "monthly" ? "Monthly" : "Yearly"}
                  {v === "yearly" && (
                    <span className="text-[8px] text-primary">Save ~20%</span>
                  )}
                </span>
                {billing === v && (
                  <motion.span
                    layoutId="pricing-pill"
                    className="absolute inset-0 rounded-full bg-secondary border border-primary/15"
                  />
                )}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {pricing.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.08}>
              <div className="relative h-full rounded-2xl p-px overflow-hidden">
                {i === 1 && (
                  <>
                    <div className="absolute inset-0 rounded-2xl border border-primary/60" />
                  </>
                )}
                <Card
                  className={
                    "relative h-full p-7 gap-0 rounded-2xl border " +
                    (i === 1
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card")
                  }
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-semibold">{p.name}</h3>
                    {i === 1 && (
                      <Badge className="bg-primary/15 text-primary border border-primary/20 text-[8px] h-5">
                        MOST POPULAR
                      </Badge>
                    )}
                  </div>
                  <p className="text-[13px] text-muted-foreground mt-3 leading-relaxed min-h-10">
                    {p.description}
                  </p>
                  <div className="flex items-end gap-1 mt-6 mb-2">
                    <span className="text-4xl font-medium tracking-tight">
                      $
                    </span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={billing}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-5xl font-medium tracking-tight tabular-nums"
                      >
                        {billing === "yearly" ? p.yearly : p.monthly}
                      </motion.span>
                    </AnimatePresence>
                    <span className="text-[10px] text-muted-foreground ml-1 mb-1.5">
                      / {i === 2 ? "member / " : ""}month
                    </span>
                  </div>
                  <p className="text-[9px] text-muted-foreground min-h-5">
                    {p.monthly === 0
                      ? "Free, for as long as you need."
                      : billing === "yearly"
                        ? "$" +
                          p.yearly * 12 +
                          (i === 2 ? " per member" : "") +
                          " billed annually"
                        : "Billed monthly"}
                  </p>
                  <Separator className="my-6" />
                  <ul className="space-y-3">
                    {p.limits.map((limit, n) => (
                      <li
                        key={limit}
                        className="flex items-center gap-2.5 text-xs"
                      >
                        <Check className="size-3.5 text-primary shrink-0" />
                        {limit}
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                aria-label={"Details for " + limit}
                                className="ml-auto size-4 text-muted-foreground"
                              />
                            }
                          >
                            <Info className="size-3" />
                          </TooltipTrigger>
                          <TooltipContent>
                            {n === 0
                              ? "Illustrative source limit per workspace. Local demo uploads do not count toward a plan."
                              : "Illustrative monthly allowance. No usage is metered in this demo."}
                          </TooltipContent>
                        </Tooltip>
                      </li>
                    ))}
                  </ul>
                  <Separator className="my-6" />
                  <ul className="space-y-3 mb-7">
                    {p.features.map((f) => (
                      <li
                        key={f}
                        className="text-xs text-muted-foreground flex gap-2.5 items-center"
                      >
                        <Check className="size-3 text-muted-foreground/60" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => {
                      toast.info(
                        p.name +
                          " is an illustrative plan. Explore the free demo below.",
                      );
                      document.getElementById("playground")?.scrollIntoView({
                        behavior: reduce ? "instant" : "smooth",
                      });
                    }}
                    className={
                      "w-full mt-auto h-10 text-xs " +
                      (i === 1
                        ? "gradient-button"
                        : "bg-secondary text-foreground border border-border hover:bg-accent")
                    }
                  >
                    {p.cta}
                    <ArrowUpRight className="size-3.5" />
                  </Button>
                </Card>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-center text-[9px] text-muted-foreground">
          Illustrative pricing · No payment or subscription is created in this
          demo.
        </p>
      </div>
    </section>
  );
}
