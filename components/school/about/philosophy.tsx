import { BookOpen, Lightbulb, MessageCircle, Rocket } from "lucide-react";

const PILLARS = [
  { title: "Strong foundations", text: "Rigorous academics create the knowledge and habits students can build upon.", icon: BookOpen },
  { title: "Curious minds", text: "Questions, creativity, and experimentation turn lessons into lasting understanding.", icon: Lightbulb },
  { title: "Confident voices", text: "Communication and collaboration help learners express ideas with clarity and empathy.", icon: MessageCircle },
  { title: "Ready to lead", text: "Practical learning, technology, and responsibility prepare students to act with purpose.", icon: Rocket },
];

export function Philosophy() {
  return (
    <section className="bg-white py-20 sm:py-24 lg:py-28" aria-labelledby="philosophy-title">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-prism-gold">Our philosophy</p>
            <h2 id="philosophy-title" className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-prism-navy sm:text-4xl lg:text-5xl">Built for learning that lasts</h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">Education should prepare students not only for examinations, but for a world that continues to change.</p>
            <p className="mt-4 leading-7 text-slate-600">At PRISM, academic strength is the starting point. Curiosity, creativity, technology, practical learning, communication, confidence, and leadership help turn that foundation into capability.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {PILLARS.map(({ title, text, icon: Icon }) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-prism-bg p-6 transition-colors hover:border-prism-gold/45">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-prism-navy shadow-sm"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <h3 className="mt-5 text-lg font-semibold text-prism-navy">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
