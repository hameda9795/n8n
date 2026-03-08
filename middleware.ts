import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple middleware that doesn't use bcrypt
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get auth token from cookie
  const authToken = request.cookies.get("next-auth.session-token")?.value || 
                    request.cookies.get("__Secure-next-auth.session-token")?.value;
  
  const isLoggedIn = !!authToken;
  
  // Check routes
  const isOnDashboard = pathname.startsWith("/dashboard");
  const isOnAdmin = pathname.startsWith("/admin");
  
  // Protect dashboard routes
  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  // Protect admin routes - let the page handle role check
  if (isOnAdmin && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
