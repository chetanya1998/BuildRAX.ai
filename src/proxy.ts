import withAuth from "next-auth/middleware";

export default withAuth;
export const proxy = withAuth;

export const config = {
  matcher: ["/dashboard/:path*", "/builder/:path*", "/profile/:path*"],
};
