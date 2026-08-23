import { describe, expect, it } from "vitest";
import { activeInDisplayOrder } from "@/features/settings/service";
import { schoolSettingsUpdateSchema, websiteProgramSchema } from "@/validations/settings";

describe("website settings validation", () => {
  it("accepts safe internal CTA paths and six-digit colors", () => {
    expect(schoolSettingsUpdateSchema.parse({ hero_primary_cta_url: "/academics", primary_color: "#0B1F3A" })).toEqual({ hero_primary_cta_url: "/academics", primary_color: "#0B1F3A" });
  });
  it("rejects unsafe URLs and malformed colors", () => {
    expect(schoolSettingsUpdateSchema.safeParse({ website_url: "javascript:alert(1)" }).success).toBe(false);
    expect(schoolSettingsUpdateSchema.safeParse({ primary_color: "navy" }).success).toBe(false);
  });
  it("rejects invalid slugs and negative display order", () => {
    expect(websiteProgramSchema.safeParse({ title: "Primary", slug: "Primary School", display_order: -1, is_active: true }).success).toBe(false);
  });
});

describe("activeInDisplayOrder", () => {
  it("filters inactive records and orders ties by title", () => {
    const result = activeInDisplayOrder([
      { title: "B", display_order: 10, is_active: true }, { title: "Hidden", display_order: 0, is_active: false }, { title: "A", display_order: 10, is_active: true }, { title: "First", display_order: 1, is_active: true },
    ]);
    expect(result.map((item) => item.title)).toEqual(["First", "A", "B"]);
  });
});
