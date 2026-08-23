import { Check, ClipboardPenLine, MessageSquareText, PhoneCall, UserCheck } from "lucide-react";
import { SectionHeading } from "@/components/school/home/section-heading";

const steps = [
  {
    title: "Enquire",
    description: "Tell us about your child and how we can reach you.",
    icon: MessageSquareText,
  },
  {
    title: "Connect",
    description: "Our team follows up to understand your needs and answer questions.",
    icon: PhoneCall,
  },
  {
    title: "Apply",
    description: "When you are ready, the team guides you through the formal application.",
    icon: ClipboardPenLine,
  },
  {
    title: "Review",
    description: "The application is reviewed and the decision is communicated clearly.",
    icon: UserCheck,
  },
  {
    title: "Confirmation",
    description: "Approved applications move to admission and class enrolment.",
    icon: Check,
  },
] as const;

export function AdmissionsProcess() {
  return (
    <section aria-labelledby="admissions-process-title" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="A supported journey"
          title="Simple steps. Thoughtful guidance."
          description="Your enquiry opens a conversation. From there, our team supports each stage of the established admissions process."
          titleId="admissions-process-title"
        />

        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="relative rounded-2xl border border-slate-200 bg-prism-bg p-5 transition duration-300 hover:-translate-y-1 hover:border-prism-gold/50 hover:shadow-lg hover:shadow-prism-navy/5">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-prism-navy text-white">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="text-xs font-semibold tracking-[0.18em] text-slate-400">0{index + 1}</span>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-prism-navy">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
