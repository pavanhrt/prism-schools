import { Clock3, HeartHandshake, Sparkles } from "lucide-react";
import { EnquiryForm } from "@/features/public/components/enquiry-form";

const principles = [
  { icon: HeartHandshake, title: "A human conversation", text: "Tell us what matters to your family and ask the questions on your mind." },
  { icon: Sparkles, title: "A learning-first approach", text: "Explore how PRISM brings academics, creativity and future-ready thinking together." },
  { icon: Clock3, title: "Clear next steps", text: "Our team will explain the relevant application and review stages after your enquiry." },
] as const;

export function AdmissionsEnquiry() {
  return (
    <section id="enquiry" aria-labelledby="enquiry-title" className="scroll-mt-24 bg-prism-bg py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-prism-gold-ink">Start here</p>
          <h2 id="enquiry-title" className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-prism-navy sm:text-4xl lg:text-5xl">
            Let&apos;s begin the conversation
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Complete this short enquiry and a member of the admissions team will be in touch.
          </p>

          <ul className="mt-9 space-y-6">
            {principles.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-prism-navy shadow-sm">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-prism-navy">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-prism-navy/[0.06] sm:p-8 lg:p-10">
          <EnquiryForm />
        </div>
      </div>
    </section>
  );
}
