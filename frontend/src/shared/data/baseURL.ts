export const baseURL =
  import.meta.env.VITE_BACKEND_URL ??
  import.meta.env.VITE_API_URL ??
  "http://localhost:8020";