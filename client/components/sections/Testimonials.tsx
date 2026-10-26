import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Quote, Star } from "lucide-react";
import SectionHeading from "@/components/landing/SectionHeading";
import { testimonials } from "@/lib/mock-data";
function Testimonial({ item }: { item: (typeof testimonials)[number] }) {
  return (
    <Card className="glass h-full p-6 gap-0 rounded-xl">
      <div className="flex justify-between mb-4">
        <div className="flex gap-0.5 text-gold">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className="size-2.5 fill-current" />
          ))}
        </div>
        <Quote className="size-4 text-primary/50" />
      </div>
      <p className="text-[13px] leading-[1.75] text-foreground/80 min-h-22">
        “{item.quote}”
      </p>
      <div className="flex gap-3 items-center border-t border-border pt-4 mt-4">
        <Avatar>
          <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
            {item.initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-[11px] font-medium">{item.name}</p>
          <p className="text-[9px] text-muted-foreground mt-0.5">{item.role}</p>
        </div>
      </div>
    </Card>
  );
}
export default function Testimonials() {
  return (
    <section className="section-space border-y border-border bg-card/30">
      <div className="container-page">
        <SectionHeading
          eyebrow="GOOD COMPANY FOR CURIOUS MINDS"
          title={
            <>
              Made for the way{" "}
              <span className="serif text-primary">you think.</span>
            </>
          }
          description="A space for curious readers and thoughtful makers."
        />
      </div>
      <div className="container-page grid gap-4 md:grid-cols-3">
        {testimonials.slice(0, 3).map((item) => (
          <Testimonial key={item.name} item={item} />
        ))}
      </div>
      <p className="text-[9px] text-center text-muted-foreground mt-5">
        Sample testimonials for this product demo.
      </p>
    </section>
  );
}
