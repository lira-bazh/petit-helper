import "server-only";

import { headers } from "next/headers";
import { cache } from "react";
import { extractLocaleFromRequest } from "@/paraglide/runtime.js";

// Keep the locale scoped to the request; never call setLocale() on the server.
export const getRequestLocale = cache(async () => {
  // Only cookie and Accept-Language are used; the URL is a placeholder.
  const request = new Request("http://localhost", { headers: await headers() });
  return extractLocaleFromRequest(request);
});
