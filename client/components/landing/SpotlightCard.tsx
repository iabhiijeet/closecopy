import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
export default function SpotlightCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("h-full", className)}>
      <Card className="glass relative h-full gap-0 rounded-2xl p-7 transition-colors duration-200 hover:border-primary/30">
        {children}
      </Card>
    </div>
  );
}
