import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED = ["/dashboard", "/checkout", "/orders"];

// Routes restricted by role
const ADMIN_ONLY = ["/admin"];
const DELIVERY_ONLY = ["/delivery"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth state read from cookies (written by the client after login)
  const token = request.cookies.get("accessToken")?.value;
  const role = request.cookies.get("userRole")?.value;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAdminOnly = ADMIN_ONLY.some((p) => pathname.startsWith(p));
  const isDeliveryOnly = DELIVERY_ONLY.some((p) => pathname.startsWith(p));

  // Not authenticated → redirect to login
  if ((isProtected || isAdminOnly || isDeliveryOnly) && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Wrong role for admin panel
  if (isAdminOnly && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Wrong role for delivery panel
  if (isDeliveryOnly && role !== "DELIVERY_PARTNER") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/delivery/:path*",
    "/checkout/:path*",
    "/orders/:path*",
  ],
};
