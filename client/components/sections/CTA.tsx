import { ArrowRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Reveal from "@/components/landing/Reveal";
import MagneticButton from "@/components/landing/MagneticButton";
export default function CTA() {
  return (
    <section className="container-page pb-20">
      <Reveal>
        <Card className="relative isolate overflow-hidden rounded-2xl bg-card border border-primary/20 py-16 sm:py-20 px-5 text-center gap-0">
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <div className="dot-grid absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />
            <div className="aurora-orb absolute -top-40 left-1/2 -translate-x-1/2 w-200 h-150" />
          </div>
          <Badge
            variant="outline"
            className="mx-auto border-primary/20 text-[9px] text-primary mb-6 h-6"
          >
            <Sparkles /> YOUR KNOWLEDGE HAS MORE TO GIVE
          </Badge>
          <h2 className="section-title text-4xl! sm:text-[52px]!">
            Make more of what you know.
            <br />
            Start <span className="serif gradient-text">creating.</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-5 max-w-100 mx-auto leading-relaxed">
            Turn the ideas in your sources into work you can use.
          </p>
          <div className="mt-7">
            <MagneticButton
              render={<a href="#playground" />}
              className="h-11 text-xs"
            >
              Find out what’s possible <ArrowRight className="size-3.5" />
            </MagneticButton>
          </div>
          <p className="mt-4 text-[9px] text-muted-foreground">
            Start free. Bring your curiosity.
          </p>
        </Card>
      </Reveal>
    </section>
  );
}
