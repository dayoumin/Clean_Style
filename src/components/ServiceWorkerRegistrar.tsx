"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

    if (process.env.NODE_ENV !== "production" || isLocalHost) {
      const wasControlled = Boolean(navigator.serviceWorker.controller);
      const resetKey = "clean-style-local-sw-reset";

      Promise.all([
        navigator.serviceWorker
          .getRegistrations()
          .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister()))),
        "caches" in window
          ? caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
          : Promise.resolve([]),
      ])
        .then(() => {
          if (wasControlled && sessionStorage.getItem(resetKey) !== "1") {
            sessionStorage.setItem(resetKey, "1");
            window.location.reload();
          }
        })
        .catch(() => undefined);
      return;
    }

    navigator.serviceWorker.register("/sw.js");
  }, []);
  return null;
}
