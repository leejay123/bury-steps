/**
 * Owners only: proxy.ts answers "page not found" here for anyone else
 * (from their sign-in token, see clerk-role.ts), and each page under here
 * checks the database itself before showing anything of its own. So this
 * no longer holds the page back while it checks.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
