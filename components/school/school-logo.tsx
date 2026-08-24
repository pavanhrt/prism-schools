import Image from "next/image";
import { cn } from "@/lib/utils";

interface SchoolLogoProps {
  /** Rendered height in pixels; width follows the logo's native square aspect ratio. */
  size?: number;
  /** Set when the logo sits on a dark (navy) background — adds a light backing panel for contrast. */
  onDark?: boolean;
  className?: string;
  preload?: boolean;
  src?: string | null;
  schoolName?: string;
}

export function shouldBypassLogoOptimization(src: string): boolean {
  if (!/^https?:\/\//i.test(src)) return false;

  try {
    const url = new URL(src);
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");

    return !(
      url.protocol === "https:" &&
      supabaseUrl.protocol === "https:" &&
      url.host === supabaseUrl.host &&
      url.pathname.startsWith("/storage/v1/object/public/public-school-media/")
    );
  } catch {
    return true;
  }
}

export function SchoolLogo({ size = 48, onDark = false, className, preload, src, schoolName = "PRISM SCHOOLS" }: SchoolLogoProps) {
  const image = (
    <Image
      src={src || "/branding/prism-logo.png"}
      alt={`${schoolName} logo`}
      width={size}
      height={size}
      preload={preload}
      unoptimized={shouldBypassLogoOptimization(src || "/branding/prism-logo.png")}
      className={cn("h-full w-auto object-contain", !onDark && className)}
      style={{ height: size, width: "auto" }}
    />
  );

  if (!onDark) return image;

  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-md bg-white p-1", className)}
      style={{ height: size + 8 }}
    >
      {image}
    </span>
  );
}
