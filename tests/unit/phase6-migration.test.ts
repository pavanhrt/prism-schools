import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync("supabase/migrations/0033_phase6_storage_and_gallery.sql", "utf8");

describe("Phase 6 storage migration security contract", () => {
  it("creates exactly the intended public and private buckets idempotently", () => {
    expect(sql).toContain("'public-school-media', 'public-school-media', true");
    expect(sql).toContain("'private-school-files', 'private-school-files', false");
    expect(sql).toContain("on conflict (id) do nothing");
  });

  it("does not authorize private access with authentication alone", () => {
    expect(sql).toContain("public.has_permission('students.view')");
    expect(sql).toContain("public.has_permission('staff.view')");
    expect(sql).not.toMatch(/private_school_files_read[\s\S]*?auth\.role\(\)\s*=\s*'authenticated'/);
  });

  it("keeps SVG and video outside the bucket allowlists", () => {
    expect(sql).not.toContain("image/svg+xml");
    expect(sql).not.toContain("video/mp4");
  });

  it("uses unambiguous POSIX literal-dot separators in SQL regexes", () => {
    expect(sql).toContain("[.](jpg|png|webp|avif)");
    expect(sql).toContain("[.](jpg|png|webp|avif|ico)");
    expect(sql).not.toContain(String.raw`\.`);
  });

  it("requires exact canonical managed paths in every storage policy", () => {
    const storagePolicySection = sql.slice(
      sql.indexOf("create policy public_school_media_read"),
      sql.indexOf("alter table public.school_settings"),
    );
    const policies = storagePolicySection.split("create policy ").slice(1);

    expect(policies).toHaveLength(8);
    for (const policy of policies) {
      expect(policy).toContain("name ~ '");
      expect(policy).toContain("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");
      expect(policy).toMatch(/name ~ '\^[^']+\$'/);
    }
    expect(storagePolicySection).toContain("branding/favicon/");
    expect(storagePolicySection).toContain("(jpg|png|webp|avif|ico)");
    expect(storagePolicySection).not.toMatch(/branding\/(logo\|og)[^']*ico/);
    expect(storagePolicySection).toContain("programs/[0-9a-f]{8}-");
    expect(storagePolicySection).toContain("services/[0-9a-f]{8}-");
    expect(storagePolicySection).not.toContain("storage.foldername(name))[1] in");
  });

  it("rechecks exact private domains and permissions for update destinations", () => {
    const updatePolicy = sql.slice(
      sql.indexOf("create policy private_school_files_update"),
      sql.indexOf("create policy private_school_files_delete"),
    );
    const withCheck = updatePolicy.slice(updatePolicy.indexOf("with check"));

    expect(withCheck).toContain("name ~ '^students/");
    expect(withCheck).toContain("public.has_permission('students.edit')");
    expect(withCheck).toContain("name ~ '^staff/");
    expect(withCheck).toContain("public.has_permission('staff.edit')");
    expect(withCheck).toContain("/photos/");
  });
});
