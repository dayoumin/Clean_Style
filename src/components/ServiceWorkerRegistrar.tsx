"use client";

import { useEffect } from "react";

const APP_SW_PATH = "/sw.js";
const APP_CACHE_PREFIX = "clean-style-";
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1"];

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const isLocalHost = LOCAL_HOSTS.includes(window.location.hostname);

    if (process.env.NODE_ENV !== "production" || isLocalHost) {
      const wasControlled = Boolean(navigator.serviceWorker.controller);
      const resetKey = "clean-style-local-sw-reset-v2";

      Promise.all([
        navigator.serviceWorker.getRegistrations().then((registrations) =>
          Promise.all(
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
              .map((registration) => registration.unregister())
          )
        ),
        "caches" in window
          ? caches
              .keys()
              .then((keys) =>
                Promise.all(
                  keys
                    .filter((key) => key.startsWith(APP_CACHE_PREFIX))
                    .map((key) => caches.delete(key))
                )
              )
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

    navigator.serviceWorker.register(APP_SW_PATH).catch(() => {});
  }, []);

  return null;
}
