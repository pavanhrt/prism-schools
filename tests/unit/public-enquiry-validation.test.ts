import { describe, expect, it } from "vitest";
import { publicEnquirySchema } from "@/validations/public";

describe("publicEnquirySchema", () => {
  it("accepts a normal submission with the honeypot left blank", () => {
    const result = publicEnquirySchema.safeParse({
      student_name: "Asha Rao",
      parent_name: "Priya Rao",
      phone: "9876543210",
      website: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a submission where the honeypot field was filled in", () => {
    const result = publicEnquirySchema.safeParse({
      student_name: "Asha Rao",
      parent_name: "Priya Rao",
      phone: "9876543210",
      website: "http://spam.example",
    });
    expect(result.success).toBe(false);
  });

  it("requires a phone number", () => {
    const result = publicEnquirySchema.safeParse({
      student_name: "Asha Rao",
      parent_name: "Priya Rao",
      phone: "",
    });
    expect(result.success).toBe(false);
  });
});
