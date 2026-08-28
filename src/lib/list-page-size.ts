/** Rows per page for both client-side (`usePagedList`) and server-side
 * (Prisma `skip`/`take`) admin list pagination. Kept in a plain module with
 * no React imports so server components can use it without pulling in a
 * client-only hook file. */
export const LIST_PAGE_SIZE = 20;
