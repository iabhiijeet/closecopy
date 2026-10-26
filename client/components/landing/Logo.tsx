import { cn } from "@/lib/utils";
export default function Logo({
  className,
  markClassName,
  markOnly = false,
}: {
  className?: string;
  markClassName?: string;
  markOnly?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 font-semibold tracking-[-0.065em]",
        className,
      )}
    >
      <span className={cn("logo-mark", markClassName)}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden="true"
          className="size-full"
        >
          <rect
            x="7"
            y="4"
            width="20"
            height="23"
            rx="5"
            fill="var(--accent-end)"
          />
          <rect
            x="4"
            y="7"
            width="20"
            height="23"
            rx="5"
            fill="var(--primary)"
          />
          <path
            d="M9 14h10M9 18h8M9 22h6"
            stroke="var(--primary-foreground)"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {!markOnly && (
        <span>
          closecopy<span className="text-primary">.</span>
        </span>
      )}
    </span>
  );
}
