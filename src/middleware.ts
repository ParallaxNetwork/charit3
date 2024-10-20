import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     * 5. all files inside /gramedia folder (should be removed in the future)
     */
    "/((?!api/|_next/|_static/|_vercel/|[\\w-]+\\.\\w+).*)",
  ],
}

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl

  const session = await getToken({ req })

  // Get the pathname of the request (e.g. /, /about, /blog/first-post)
  const pathname = url.pathname

  const authPathnames = ["/"]

  if (authPathnames.includes(pathname) && session) {
    return NextResponse.redirect(new URL("/verify", req.url))
  } else if (!authPathnames.includes(pathname) && !session) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
}
