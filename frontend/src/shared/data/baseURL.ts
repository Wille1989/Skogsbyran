function resolveBaseUrl(): string {
  const baseUrl =
    import.meta.env.VITE_BACKEND_URL?.trim() ||
    import.meta.env.VITE_API_URL?.trim();

  if (baseUrl) {
    return baseUrl.replace(/\/+$/, "");
  }

  if (import.meta.env.DEV) {
    return "http://localhost:8020";
  }

  throw new Error(
    "Missing backend URL. Set VITE_BACKEND_URL."
  );
}

export const baseURL: string = resolveBaseUrl();