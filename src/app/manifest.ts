import type { MetadataRoute } from "next";
import { APP_COPY, IS_STUDENT_VARIANT } from "@/data/appVariant";
import { ADULT_ICON_DIRECTORY, ADULT_THEME_COLOR } from "@/products/adult/theme";

export default function manifest(): MetadataRoute.Manifest {
  const iconDirectory = IS_STUDENT_VARIANT ? '/icons' : ADULT_ICON_DIRECTORY;
  return {
    name: APP_COPY.title,
    short_name: APP_COPY.shortTitle,
    description: APP_COPY.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: IS_STUDENT_VARIANT ? "#4f46e5" : ADULT_THEME_COLOR,
    orientation: "portrait",
    icons: [
      {
        src: `${iconDirectory}/icon-192-maskable.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${iconDirectory}/icon-512-maskable.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${iconDirectory}/icon-192-maskable.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: `${iconDirectory}/icon-512-maskable.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
