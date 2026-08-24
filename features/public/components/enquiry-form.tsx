"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { publicEnquirySchema, type PublicEnquiryInput } from "@/validations/public";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EnquiryForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PublicEnquiryInput>({ resolver: zodResolver(publicEnquirySchema) });

  async function onSubmit(values: PublicEnquiryInput) {
    setStatus("idle");
    setError(null);
    try {
      const response = await fetch("/api/public/enquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      setStatus("success");
      reset();
    } catch {
      setError("Could not reach the server. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div role="status" aria-live="polite" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-10 text-center text-emerald-800">
        <p className="text-xl font-semibold">Thank you for reaching out.</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6">
          We&apos;ve received your enquiry. A member of the PRISM admissions team will be in touch soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-prism-gold-ink">Admissions enquiry</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-prism-navy">Tell us a little about your child</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">Fields marked with <span aria-hidden="true">*</span><span className="sr-only">an asterisk</span> are required.</p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="student_name">Student name <span aria-hidden="true" className="text-prism-gold-ink">*</span></Label>
          <Input id="student_name" autoComplete="name" placeholder="Child's full name" className="h-11 border-slate-300 focus-visible:ring-prism-navy" aria-required="true" aria-invalid={Boolean(errors.student_name)} aria-describedby={errors.student_name ? "student_name-error" : undefined} {...register("student_name")} />
          {errors.student_name && <p id="student_name-error" role="alert" className="text-xs font-medium text-red-700">{errors.student_name.message}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="parent_name">Parent / guardian name <span aria-hidden="true" className="text-prism-gold-ink">*</span></Label>
          <Input id="parent_name" autoComplete="name" placeholder="Your full name" className="h-11 border-slate-300 focus-visible:ring-prism-navy" aria-required="true" aria-invalid={Boolean(errors.parent_name)} aria-describedby={errors.parent_name ? "parent_name-error" : undefined} {...register("parent_name")} />
          {errors.parent_name && <p id="parent_name-error" role="alert" className="text-xs font-medium text-red-700">{errors.parent_name.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Phone <span aria-hidden="true" className="text-prism-gold-ink">*</span></Label>
          <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="Your contact number" className="h-11 border-slate-300 focus-visible:ring-prism-navy" aria-required="true" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "phone-error" : undefined} {...register("phone")} />
          {errors.phone && <p id="phone-error" role="alert" className="text-xs font-medium text-red-700">{errors.phone.message}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email (optional)</Label>
          <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" className="h-11 border-slate-300 focus-visible:ring-prism-navy" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} {...register("email")} />
          {errors.email && <p id="email-error" role="alert" className="text-xs font-medium text-red-700">{errors.email.message}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="message">How can we help? (optional)</Label>
        <textarea id="message" rows={4} placeholder="Share a class preference, question or anything you would like our team to know." aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "message-error" : undefined} className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm leading-6 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-navy" {...register("message")} />
        {errors.message && <p id="message-error" role="alert" className="text-xs font-medium text-red-700">{errors.message.message}</p>}
      </div>
      {/* Honeypot — hidden from real visitors via CSS, not display:none
          (which some bots skip), and never receives keyboard/tab focus. */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="website">Leave this field blank</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>
      {error && <p role="alert" aria-live="assertive" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={isSubmitting} className="min-h-12 w-full bg-prism-navy px-6 text-white hover:bg-prism-navy-light focus-visible:ring-prism-navy sm:w-auto">
        {isSubmitting ? "Sending enquiry…" : "Send Admissions Enquiry"}
      </Button>
      <p className="text-xs leading-5 text-slate-500">Submitting this form sends your details to the PRISM admissions team so they can respond to your enquiry.</p>
    </form>
  );
}
