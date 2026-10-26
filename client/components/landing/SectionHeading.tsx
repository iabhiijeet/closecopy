import Reveal from "./Reveal";
export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <Reveal
      className={
        align === "center"
          ? "mx-auto mb-11 max-w-2xl text-center"
          : "mb-9 max-w-xl"
      }
    >
      <p className="eyebrow mb-4">
        <span className="inline-block size-1.5 rounded-full bg-primary mr-2" />
        {eyebrow}
      </p>
      <h2 className="section-title">{title}</h2>
      {description && (
        <p className="mt-4 text-muted-foreground leading-relaxed text-sm sm:text-[15px]">
          {description}
        </p>
      )}
    </Reveal>
  );
}
