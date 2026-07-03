"use client";

import { useEffect } from "react";

const APP_SW_PATH = "/sw.js";
const APP_CACHE_PREFIX = "clean-style-";

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations
          .filter((registration) => {
            const scriptUrls = [
              registration.active?.scriptURL,
              registration.installing?.scriptURL,
              registration.waiting?.scriptURL,
            ].filter((scriptUrl): scriptUrl is string => Boolean(scriptUrl));

            return scriptUrls.some((scriptUrl) => {
              try {
                return new URL(scriptUrl).pathname === APP_SW_PATH;
              } catch {
                return false;
              }
            });
          })
          .forEach((registration) => {
            registration.unregister().catch(() => {});
          });
      }).catch(() => {});

      if ("caches" in window) {
        caches.keys().then((keys) => {
          keys
            .filter((key) => key.startsWith(APP_CACHE_PREFIX))
            .forEach((key) => {
              caches.delete(key).catch(() => {});
            });
        }).catch(() => {});
      }
      return;
    }

    navigator.serviceWorker.register(APP_SW_PATH).catch(() => {});
  }, []);
  return null;
}
