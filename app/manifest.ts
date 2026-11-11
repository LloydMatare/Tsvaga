import type { MetadataRoute } from "next";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Zimbabwe stays, food and travel`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#FAFBF8",
    theme_color: "#5C7057",
    orientation: "portrait-primary",
    categories: ["travel", "booking", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Search stays",
        short_name: "Stays",
        url: "/stays",
        description: "Find lodges, hotels and safari camps",
      },
      {
        name: "My trips",
        short_name: "Trips",
        url: "/trips",
        description: "View your bookings and vouchers",
      },
    ],
  };
}
