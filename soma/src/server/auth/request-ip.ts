import "server-only";

import { getConfig } from "../config";
import { clientIpFrom } from "./client-ip";

/** Client IP of the current request from the configured trusted source; null outside a request. */
export async function currentRequestIp(): Promise<string | null> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const cfg = getConfig();
    return clientIpFrom((name) => h.get(name), { header: cfg.TRUSTED_IP_HEADER, hops: cfg.TRUSTED_PROXY_HOPS });
  } catch {
    return null; // no request scope (scripts, tests)
  }
}
