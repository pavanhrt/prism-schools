import { describe, expect, it } from "vitest";
import { renderTemplate } from "@/features/communication/render";

describe("renderTemplate", () => {
  it("substitutes known tags", () => {
    expect(renderTemplate("Hi {student_name}, welcome to {school_name}.", {
      student_name: "Asha",
      school_name: "Green Valley School",
    })).toBe("Hi Asha, welcome to Green Valley School.");
  });

  it("leaves an unknown tag untouched instead of dropping it silently", () => {
    expect(renderTemplate("Hi {student_name}, your balance is {unknown_tag}.", {
      student_name: "Asha",
    })).toBe("Hi Asha, your balance is {unknown_tag}.");
  });

  it("handles a template with no tags at all", () => {
    expect(renderTemplate("Plain message.", {})).toBe("Plain message.");
  });
});
