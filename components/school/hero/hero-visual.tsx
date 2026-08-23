import { Atom, Bot, BrainCircuit, Code2, Lightbulb } from "lucide-react";

const learningSignals = [
  { label: "AI", className: "hero-signal--ai", Icon: BrainCircuit },
  { label: "Robotics", className: "hero-signal--robotics", Icon: Bot },
  { label: "Science", className: "hero-signal--science", Icon: Atom },
  { label: "Coding", className: "hero-signal--coding", Icon: Code2 },
  { label: "Creativity", className: "hero-signal--creativity", Icon: Lightbulb },
];

export function HeroVisual() {
  return (
    <div className="hero-visual-wrap relative z-10 mx-auto w-full max-w-[38rem]" aria-hidden="true">
      <div className="hero-visual">
        <div className="hero-visual__grid" />
        <div className="hero-orbit hero-orbit--outer" />
        <div className="hero-orbit hero-orbit--inner" />

        <div className="hero-beams">
          <span className="hero-beam hero-beam--one" />
          <span className="hero-beam hero-beam--two" />
          <span className="hero-beam hero-beam--three" />
          <span className="hero-beam hero-beam--four" />
        </div>

        <div className="hero-prism">
          <div className="hero-prism__face" />
          <div className="hero-prism__core" />
        </div>

        {learningSignals.map(({ label, className, Icon }) => (
          <div key={label} className={`hero-signal ${className}`}>
            <Icon className="h-4 w-4" strokeWidth={1.7} />
            <span>{label}</span>
          </div>
        ))}

        <div className="hero-visual__caption">
          <span>Knowledge in</span>
          <span className="hero-visual__caption-line" />
          <span>Possibility out</span>
        </div>
      </div>
    </div>
  );
}
