import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { protectedPath, loginRedirectPath } from "@/lib/auth-routing";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers = {}) {
          const previousCookies = response.cookies.getAll();
          const cacheHeaders = ["cache-control", "expires", "pragma"]
            .map((name) => [name, response.headers.get(name)] as const);
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          previousCookies.forEach((cookie) => response.cookies.set(cookie));
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          cacheHeaders.forEach(([name, value]) => {
            if (value) response.headers.set(name, value);
          });
          Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
        },
      },
    },
  );

  const {
    data: { user }, error,
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if ((!user || error) && protectedPath(pathname)) {
    const url = request.nextUrl.clone();
    const destination = new URL(loginRedirectPath(pathname, request.nextUrl.search), url.origin);
    url.pathname = destination.pathname;
    url.search = destination.search;
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    for (const name of ["cache-control", "expires", "pragma"]) {
      const value = response.headers.get(name);
      if (value) redirect.headers.set(name, value);
    }
    return redirect;
  }

  return response;
}
