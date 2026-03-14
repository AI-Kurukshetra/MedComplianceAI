import type { NextRequest } from "next/server";
import { proxy, proxyConfig } from "../proxy";

const proxyMatcher = proxyConfig.matcher;
void proxyMatcher;

export async function middleware(request: NextRequest) {
  return proxy(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
