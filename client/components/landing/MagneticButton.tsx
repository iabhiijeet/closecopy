import { cva } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
const styles = cva(
  "relative h-11 px-5 rounded-lg text-sm font-semibold transition-colors duration-200",
  {
    variants: {
      tone: {
        gradient: "gradient-button border-primary/30",
        outline: "border-border bg-background text-foreground hover:bg-muted",
        ghost: "bg-transparent text-foreground hover:bg-muted",
      },
    },
    defaultVariants: { tone: "gradient" },
  },
);
export default function MagneticButton({
  children,
  className,
  tone = "gradient",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "variant"> & {
  tone?: "gradient" | "outline" | "ghost";
}) {
  return (
    <span className="inline-flex">
      <Button
        variant={tone === "gradient" ? "default" : tone}
        nativeButton={props.render ? false : undefined}
        role={props.render ? "link" : undefined}
        className={cn(styles({ tone }), className)}
        {...props}
      >
        {children}
      </Button>
    </span>
  );
}
