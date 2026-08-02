import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * A storefront ships no user-generated HTML, so we can afford a strict posture.
 * CSP is deliberately left out until Phase 7, when the full set of runtime
 * origins (payments, analytics) is known — a CSP written too early gets
 * loosened rather than tightened, which defeats the point.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    // AVIF first: the garment renders are large flat blacks, which AVIF encodes
    // far better than WebP. Falls back automatically on unsupported clients.
    formats: ["image/avif", "image/webp"],
    // Matches the breakpoints the hero and turnaround actually request.
    deviceSizes: [420, 640, 828, 1080, 1280, 1600, 1920, 2560, 3840],
    imageSizes: [64, 128, 256, 384, 512],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
