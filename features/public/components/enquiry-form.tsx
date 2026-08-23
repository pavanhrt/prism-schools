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
      <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-6 text-center text-sm text-emerald-700">
        Thank you — we&apos;ve received your enquiry and someone from our admissions team
        will be in touch soon.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="student_name">Student name</Label>
          <Input id="student_name" aria-invalid={Boolean(errors.student_name)} aria-describedby={errors.student_name ? "student_name-error" : undefined} {...register("student_name")} />
          {errors.student_name && <p id="student_name-error" className="text-xs text-red-600">{errors.student_name.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="parent_name">Your name</Label>
          <Input id="parent_name" aria-invalid={Boolean(errors.parent_name)} aria-describedby={errors.parent_name ? "parent_name-error" : undefined} {...register("parent_name")} />
          {errors.parent_name && <p id="parent_name-error" className="text-xs text-red-600">{errors.parent_name.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "phone-error" : undefined} {...register("phone")} />
          {errors.phone && <p id="phone-error" className="text-xs text-red-600">{errors.phone.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email (optional)</Label>
          <Input id="email" type="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} {...register("email")} />
          {errors.email && <p id="email-error" className="text-xs text-red-600">{errors.email.message}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="message">Message (optional)</Label>
        <textarea id="message" rows={3} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "message-error" : undefined} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prism-navy" {...register("message")} />
        {errors.message && <p id="message-error" className="text-xs text-red-600">{errors.message.message}</p>}
      </div>
      {/* Honeypot — hidden from real visitors via CSS, not display:none
          (which some bots skip), and never receives keyboard/tab focus. */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="website">Leave this field blank</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={isSubmitting} className="self-start bg-prism-navy text-white hover:bg-prism-navy-light focus-visible:ring-prism-navy">
        {isSubmitting ? "Sending…" : "Send enquiry"}
      </Button>
    </form>
  );
}
