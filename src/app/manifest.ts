import type { MetadataRoute } from "next";

// Makes SITREP installable to a phone's home screen (Next.js metadata
// convention — served at /manifest.webmanifest). Per the Next.js PWA guide,
// a manifest + HTTPS (Vercel) is all installation needs; no service worker
// (push notifications were deliberately skipped).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SITREP — Global Intelligence Command Center",
    short_name: "SITREP",
    description: "Live geopolitics, Indian polity and world news, with regional AI situation reports.",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0a1022",
    theme_color: "#0a1022",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
