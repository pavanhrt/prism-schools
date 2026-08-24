interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
  inverse?: boolean;
  titleId?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  inverse = false,
  titleId,
}: SectionHeadingProps) {
  const alignment = align === "center" ? "mx-auto text-center" : "";

  return (
    <div className={`max-w-3xl ${alignment}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${inverse ? "text-prism-gold" : "text-prism-gold-ink"}`}>{eyebrow}</p>
      <h2 id={titleId} className={`mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl lg:text-5xl ${inverse ? "text-white" : "text-prism-navy"}`}>
        {title}
      </h2>
      <p className={`mt-5 text-base leading-7 sm:text-lg sm:leading-8 ${inverse ? "text-slate-300" : "text-slate-600"}`}>
        {description}
      </p>
    </div>
  );
}
