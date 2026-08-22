import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Our mission, vision, and history.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-3xl font-semibold text-slate-900">About Us</h1>
      <div className="mt-8 flex flex-col gap-8 text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Our Mission</h2>
          <p className="mt-2">
            To provide a nurturing environment where every student is equipped with the
            knowledge, character, and confidence to thrive.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Our Vision</h2>
          <p className="mt-2">
            To be a school recognized for academic excellence and the strength of its
            community, inside and outside the classroom.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Principal&apos;s Message</h2>
          <p className="mt-2">
            Every student who walks through our doors brings something the school becomes
            better for having. Our role is to notice it, and help it grow.
          </p>
        </section>
      </div>
    </div>
  );
}
