import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : "invalid.local";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, port: "", pathname: "/storage/v1/object/public/public-school-media/**" },
      { protocol: "https", hostname: supabaseHost, port: "", pathname: "/storage/v1/object/sign/private-school-files/**" },
    ],
    qualities: [75],
  },
};

export default nextConfig;
