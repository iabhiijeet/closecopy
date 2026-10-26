"use client";
import { useState } from "react";
import { ArrowRight, Code2, Users, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Logo from "@/components/landing/Logo";
const groups = [
  {
    title: "PRODUCT",
    links: [
      ["Features", "features"],
      ["Artifacts", "artifacts"],
      ["Pricing", "pricing"],
    ],
  },
  {
    title: "EXPLORE",
    links: [
      ["How it works", "how-it-works"],
      ["Playground", "playground"],
      ["Common questions", "faq"],
    ],
  },
];
export default function Footer() {
  const [email, setEmail] = useState("");
  return (
    <footer className="relative overflow-hidden border-t border-border pt-13">
      <div className="container-page">
        <div className="grid grid-cols-2 lg:grid-cols-[1.5fr_0.7fr_0.8fr_1.5fr] gap-10 pb-12">
          <div className="col-span-2 lg:col-span-1">
            <a
              href="#home"
              className="text-2xl"
              aria-label="Back to closecopy home"
            >
              <Logo />
            </a>
            <p className="mt-4 text-xs text-muted-foreground leading-relaxed max-w-55">
              A home for your knowledge.
              <br />A starting point for what’s next.
            </p>
            <div className="mt-5 flex gap-1">
              {[
                { Icon: Code2, label: "GitHub" },
                { Icon: Users, label: "LinkedIn" },
                { Icon: AtSign, label: "Social updates" },
              ].map(({ Icon, label }) => (
                <Button
                  key={label}
                  variant="ghost"
                  size="icon-sm"
                  aria-label={label}
                  onClick={() =>
                    toast.info(
                      label +
                        " links will be available when closecopy launches.",
                    )
                  }
                  className="text-muted-foreground"
                >
                  <Icon className="size-3.5" />
                </Button>
              ))}
            </div>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <h3 className="app-label text-[9px] mb-5">{g.title}</h3>
              <ul className="space-y-3">
                {g.links.map(([label, id]) => (
                  <li key={id}>
                    <a
                      href={"#" + id}
                      className="text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="col-span-2 lg:col-span-1">
            <h3 className="text-sm tracking-tight mb-2">
              A little inspiration in your inbox.
            </h3>
            <p className="text-[11px] text-muted-foreground mb-4">
              New ideas. Product updates. The occasional good read.
            </p>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!email.trim()) return;
                toast.success(
                  "You’re on the demo list. No email was sent or saved.",
                );
                setEmail("");
              }}
            >
              <Input
                type="email"
                required
                aria-label="Newsletter email address"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 bg-card text-[11px]"
              />
              <Button
                type="submit"
                className="gradient-button h-10 w-10 shrink-0"
                aria-label="Join the newsletter"
              >
                <ArrowRight className="size-4" />
              </Button>
            </form>
            <p className="text-[8px] text-muted-foreground mt-2">
              Demo signup · Nothing leaves your browser.
            </p>
          </div>
        </div>
        <Separator />
        <div className="flex flex-wrap justify-between gap-4 py-5 text-[9px] text-muted-foreground">
          <p>© {new Date().getFullYear()} closecopy. Made for curious minds.</p>
          <div className="flex gap-5">
            <Button
              variant="link"
              className="h-auto p-0 text-[9px] text-muted-foreground"
              onClick={() =>
                toast.info(
                  "This demo keeps data in browser memory. No files or email addresses are uploaded or stored.",
                )
              }
            >
              Privacy
            </Button>
            <Button
              variant="link"
              className="h-auto p-0 text-[9px] text-muted-foreground"
              onClick={() =>
                toast.info(
                  "A frontend demonstration with illustrative plans and sample content. No account or contract is created.",
                )
              }
            >
              Terms
            </Button>
            <span className="flex gap-1.5 items-center">
              <span className="size-1 rounded-full bg-success" /> Frontend demo
            </span>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="select-none text-center text-[clamp(75px,17.5vw,210px)] leading-[.94] font-semibold tracking-[-.085em] text-foreground/5 -mb-[.08em]"
        >
          closecopy<span className="text-primary/10">.</span>
        </div>
      </div>
    </footer>
  );
}
