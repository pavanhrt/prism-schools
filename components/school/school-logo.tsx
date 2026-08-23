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

export function SchoolLogo({ size = 48, onDark = false, className, preload, src, schoolName = "PRISM SCHOOLS" }: SchoolLogoProps) {
  const image = (
    <Image
      src={src || "/branding/prism-logo.png"}
      alt={`${schoolName} logo`}
      width={1254}
      height={1254}
      preload={preload}
      unoptimized={Boolean(src && /^https?:\/\//i.test(src))}
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
