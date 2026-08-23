"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  createWebsiteFeatureAction,
  createWebsiteProgramAction,
  createWebsiteServiceAction,
  deleteWebsiteFeatureAction,
  deleteWebsiteProgramAction,
  deleteWebsiteServiceAction,
  updateSchoolSettingsAction,
  updateWebsiteFeatureAction,
  updateWebsiteProgramAction,
  updateWebsiteServiceAction,
} from "@/features/settings/actions";
import type {
  SchoolSettings,
  WebsiteAdminConfig,
  WebsiteFeature,
  WebsiteProgram,
  WebsiteService,
} from "@/types/settings";
import {
  schoolSettingsUpdateSchema,
  websiteFeatureSchema,
  websiteProgramSchema,
  websiteServiceSchema,
  type SchoolSettingsUpdateInput,
  type WebsiteFeatureInput,
  type WebsiteProgramInput,
  type WebsiteServiceInput,
} from "@/validations/settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SettingsSection = "branding" | "hero" | "contact" | "social" | "seo";
type CollectionSection = "programs" | "services" | "features";
type Section = SettingsSection | CollectionSection;

const SECTIONS: { key: Section; label: string }[] = [
  { key: "branding", label: "Branding" },
  { key: "hero", label: "Hero" },
  { key: "contact", label: "Contact" },
  { key: "social", label: "Social" },
  { key: "seo", label: "SEO" },
  { key: "programs", label: "Academic Programs" },
  { key: "services", label: "Future Learning" },
  { key: "features", label: "Why PRISM" },
];

const SETTINGS_FIELDS: Record<SettingsSection, (keyof SchoolSettingsUpdateInput)[]> = {
  branding: ["school_name", "short_name", "tagline", "logo_url", "favicon_url", "primary_color", "secondary_color", "accent_color"],
  hero: ["hero_eyebrow", "hero_tagline", "hero_title", "hero_description", "hero_primary_cta_label", "hero_primary_cta_url", "hero_secondary_cta_label", "hero_secondary_cta_url"],
  contact: ["contact_email", "contact_phone", "website_url", "address_line", "city", "district", "state", "country", "postal_code", "google_maps_url"],
  social: ["facebook_url", "instagram_url", "youtube_url", "linkedin_url"],
  seo: ["seo_title", "seo_description", "og_image_url"],
};

const FIELD_LABELS: Record<keyof SchoolSettingsUpdateInput, string> = {
  school_name: "School name", short_name: "Short name", tagline: "Tagline", description: "Description",
  logo_url: "Logo URL or path", favicon_url: "Favicon URL or path", primary_color: "Primary color", secondary_color: "Secondary color", accent_color: "Accent color",
  hero_eyebrow: "Hero eyebrow", hero_tagline: "Hero tagline", hero_title: "Hero title", hero_description: "Hero description",
  hero_primary_cta_label: "Primary CTA label", hero_primary_cta_url: "Primary CTA link", hero_secondary_cta_label: "Secondary CTA label", hero_secondary_cta_url: "Secondary CTA link",
  contact_email: "Contact email", contact_phone: "Contact phone", website_url: "Website URL", address_line: "Address", city: "City", district: "District", state: "State", country: "Country", postal_code: "Postal code", google_maps_url: "Google Maps URL",
  facebook_url: "Facebook URL", instagram_url: "Instagram URL", youtube_url: "YouTube URL", linkedin_url: "LinkedIn URL",
  seo_title: "Default SEO title", seo_description: "Default SEO description", og_image_url: "Open Graph image URL or path",
};

function settingsDefaults(settings: SchoolSettings): SchoolSettingsUpdateInput {
  return Object.fromEntries(
    Object.keys(FIELD_LABELS).map((key) => [key, settings[key as keyof SchoolSettings] ?? ""]),
  ) as SchoolSettingsUpdateInput;
}

function SettingsEditor({ settings, canManage, section }: { settings: SchoolSettings; canManage: boolean; section: SettingsSection }) {
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<SchoolSettingsUpdateInput>({
    resolver: zodResolver(schoolSettingsUpdateSchema),
    defaultValues: settingsDefaults(settings),
  });

  async function save() {
    setMessage(null);
    const values = getValues();
    const payload = Object.fromEntries(SETTINGS_FIELDS[section].map((key) => [key, values[key]]));
    const parsed = schoolSettingsUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "Check the highlighted fields.");
      return;
    }
    const result = await updateSchoolSettingsAction(parsed.data);
    setMessage(result.ok ? "Saved. Public pages will use the updated content." : result.error);
    if (result.ok) router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Website details</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Media uploads are deferred to Phase 6. Enter a safe URL or public path for now.</p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(save)} className="grid gap-4 md:grid-cols-2">
          {SETTINGS_FIELDS[section].map((name) => {
            const multiline = name.includes("description") || name === "address_line";
            const error = errors[name]?.message;
            return (
              <div key={name} className={`flex flex-col gap-1.5 ${multiline ? "md:col-span-2" : ""}`}>
                <Label htmlFor={name}>{FIELD_LABELS[name]}</Label>
                {multiline ? (
                  <textarea id={name} rows={4} disabled={!canManage} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:bg-slate-50 disabled:text-slate-500" {...register(name)} />
                ) : (
                  <Input id={name} disabled={!canManage} type={name.includes("email") ? "email" : "text"} {...register(name)} />
                )}
                {error && <p className="text-xs text-red-600">{String(error)}</p>}
              </div>
            );
          })}
          <div className="flex items-center gap-3 md:col-span-2">
            {canManage && <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : `Save ${SECTIONS.find((item) => item.key === section)?.label}`}</Button>}
            {!canManage && <p className="text-sm text-slate-500">You have read-only access to website settings.</p>}
            {message && <p aria-live="polite" className={`text-sm ${message.startsWith("Saved") ? "text-emerald-700" : "text-red-600"}`}>{message}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

type CollectionRecord = WebsiteProgram | WebsiteService | WebsiteFeature;
const COLLECTION_COPY: Record<CollectionSection, { title: string; description: string }> = {
  programs: { title: "Public website academic programs", description: "Marketing content only. These records are separate from operational School OS classes." },
  services: { title: "Future Learning services", description: "Manage capabilities such as AI, robotics, creative thinking and real-world skills." },
  features: { title: "Why PRISM features", description: "Manage the differentiators presented on the public website." },
};

function CollectionManager({ kind, records, canManage }: { kind: CollectionSection; records: CollectionRecord[]; canManage: boolean }) {
  const [editing, setEditing] = useState<CollectionRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const schema = kind === "programs" ? websiteProgramSchema : kind === "services" ? websiteServiceSchema : websiteFeatureSchema;
  const editKey = editing?.id ?? "new";

  function submit(formData: FormData) {
    setError(null);
    const raw: Record<string, unknown> = {
      title: formData.get("title"), description: formData.get("description"), icon: formData.get("icon"),
      display_order: formData.get("display_order"), is_active: formData.get("is_active") === "on",
    };
    if (kind !== "features") Object.assign(raw, { slug: formData.get("slug"), short_description: formData.get("short_description") });
    if (kind === "programs") Object.assign(raw, { level: formData.get("level"), headline: formData.get("headline"), image_url: formData.get("image_url") });
    if (kind === "services") Object.assign(raw, { visual_type: formData.get("visual_type"), visual_asset_url: formData.get("visual_asset_url") });
    const parsed = schema.safeParse(raw);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check the form values."); return; }

    startTransition(async () => {
      let result;
      if (kind === "programs") result = editing ? await updateWebsiteProgramAction(editing.id, parsed.data as WebsiteProgramInput) : await createWebsiteProgramAction(parsed.data as WebsiteProgramInput);
      else if (kind === "services") result = editing ? await updateWebsiteServiceAction(editing.id, parsed.data as WebsiteServiceInput) : await createWebsiteServiceAction(parsed.data as WebsiteServiceInput);
      else result = editing ? await updateWebsiteFeatureAction(editing.id, parsed.data as WebsiteFeatureInput) : await createWebsiteFeatureAction(parsed.data as WebsiteFeatureInput);
      if (!result.ok) { setError(result.error); return; }
      setEditing(null); router.refresh();
    });
  }

  function remove(record: CollectionRecord) {
    if (!window.confirm(`Delete “${record.title}”? Disable it instead if you only want to hide it publicly.`)) return;
    startTransition(async () => {
      const result = kind === "programs" ? await deleteWebsiteProgramAction(record.id) : kind === "services" ? await deleteWebsiteServiceAction(record.id) : await deleteWebsiteFeatureAction(record.id);
      if (!result.ok) { setError(result.error); return; }
      if (editing?.id === record.id) setEditing(null);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Card>
        <CardHeader><div><CardTitle>{COLLECTION_COPY[kind].title}</CardTitle><p className="mt-1 text-sm text-slate-500">{COLLECTION_COPY[kind].description}</p></div></CardHeader>
        <CardContent className="flex flex-col gap-3">
          {records.map((record) => (
            <div key={record.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-slate-900">{record.title}</p><Badge variant={record.is_active ? "success" : "outline"}>{record.is_active ? "active" : "hidden"}</Badge><Badge variant="outline">order {record.display_order}</Badge></div><p className="mt-1 line-clamp-2 text-sm text-slate-500">{record.description || ("short_description" in record ? record.short_description : null) || "No description"}</p></div>
              {canManage && <div className="flex shrink-0 gap-2"><Button size="sm" variant="outline" disabled={pending} onClick={() => setEditing(record)}>Edit</Button><Button size="sm" variant="destructive" disabled={pending} onClick={() => remove(record)}>Delete</Button></div>}
            </div>
          ))}
          {records.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No content yet.</p>}
        </CardContent>
      </Card>
      {canManage && <Card key={editKey} className="h-fit">
        <CardHeader><CardTitle>{editing ? `Edit ${editing.title}` : "Add entry"}</CardTitle></CardHeader>
        <CardContent>
          <form action={submit} className="flex flex-col gap-4">
            <Field name="title" label="Title" required defaultValue={editing?.title} />
            {kind !== "features" && <Field name="slug" label="Slug" required defaultValue={editing && "slug" in editing ? editing.slug : ""} hint="Lowercase letters, numbers and hyphens." />}
            {kind === "programs" && <><Field name="level" label="Level" defaultValue={(editing && "level" in editing ? editing.level : "") ?? ""} /><Field name="headline" label="Headline" defaultValue={(editing && "headline" in editing ? editing.headline : "") ?? ""} /></>}
            {kind !== "features" && <TextArea name="short_description" label="Short description" defaultValue={(editing && "short_description" in editing ? editing.short_description : "") ?? ""} />}
            <TextArea name="description" label="Description" required={kind === "features"} defaultValue={editing?.description ?? ""} />
            <Field name="icon" label="Icon or visual identifier" defaultValue={editing?.icon ?? ""} />
            {kind === "programs" && <Field name="image_url" label="Image URL or path" defaultValue={(editing && "image_url" in editing ? editing.image_url : "") ?? ""} />}
            {kind === "services" && <><Field name="visual_type" label="Visual type" defaultValue={(editing && "visual_type" in editing ? editing.visual_type : "") ?? ""} /><Field name="visual_asset_url" label="Asset URL or path" defaultValue={(editing && "visual_asset_url" in editing ? editing.visual_asset_url : "") ?? ""} /></>}
            <Field name="display_order" label="Display order" type="number" min={0} required defaultValue={editing?.display_order ?? 0} />
            <label className="flex items-center gap-2 text-sm text-slate-700"><input name="is_active" type="checkbox" defaultChecked={editing?.is_active ?? true} /> Visible on public website</label>
            {error && <p aria-live="polite" className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2"><Button type="submit" disabled={pending}>{pending ? "Saving…" : editing ? "Save changes" : "Add entry"}</Button>{editing && <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>}</div>
          </form>
        </CardContent>
      </Card>}
    </div>
  );
}

function Field({ label, hint, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = String(props.name);
  return <div className="flex flex-col gap-1.5"><Label htmlFor={id}>{label}</Label><Input id={id} {...props} />{hint && <p className="text-xs text-slate-500">{hint}</p>}</div>;
}

function TextArea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const id = String(props.name);
  return <div className="flex flex-col gap-1.5"><Label htmlFor={id}>{label}</Label><textarea id={id} rows={4} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400" {...props} /></div>;
}

export function WebsiteSettingsManager({ config, canManage }: { config: WebsiteAdminConfig; canManage: boolean }) {
  const [section, setSection] = useState<Section>("branding");
  const settingsSection = useMemo(() => (["branding", "hero", "contact", "social", "seo"] as Section[]).includes(section), [section]);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Website settings sections">
        {SECTIONS.map((item) => <Button key={item.key} type="button" size="sm" variant={section === item.key ? "default" : "outline"} onClick={() => setSection(item.key)}>{item.label}</Button>)}
      </div>
      {settingsSection && <SettingsEditor key={section} settings={config.settings} canManage={canManage} section={section as SettingsSection} />}
      {section === "programs" && <CollectionManager kind="programs" records={config.programs} canManage={canManage} />}
      {section === "services" && <CollectionManager kind="services" records={config.services} canManage={canManage} />}
      {section === "features" && <CollectionManager kind="features" records={config.features} canManage={canManage} />}
    </div>
  );
}
