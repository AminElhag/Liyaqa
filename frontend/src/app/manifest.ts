import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Liyaqa - Gym Management",
    short_name: "Liyaqa",
    description: "Complete gym and fitness club management platform",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#FF6B4A",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/assets/logo-liyaqa-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/assets/favicon.svg",
        sizes: "32x32",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "Go to dashboard",
        url: "/en/dashboard",
      },
      {
        name: "Members",
        short_name: "Members",
        description: "View members",
        url: "/en/members",
      },
      {
        name: "Check-in",
        short_name: "Check-in",
        description: "Member check-in",
        url: "/en/attendance",
      },
    ],
    categories: ["business", "fitness", "productivity"],
    prefer_related_applications: false,
    scope: "/",
    lang: "en",
    dir: "ltr",
  };
}
