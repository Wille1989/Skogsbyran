// This path reduces exposure only. Sessions and admin authorization remain server-side.
const slug = import.meta.env.VITE_ADMIN_LOGIN_SLUG?.trim();

// Fail closed when missing/invalid. One lowercase segment; cannot collide with "properties".
export const adminLoginPath: string | null = slug && /^[a-z0-9][a-z0-9-]{11,63}$/.test(slug)
    ? `/admin/${slug}`
    : null;
