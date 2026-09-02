export class ApiError extends Error {
    constructor(message: string, public readonly status?: number, public readonly details?: unknown) {
        super(message);
        this.name = "ApiError";
    }
}

export async function apiFetch<T>(url: string, options: RequestInit = {} ): Promise<T> {
    let response: Response;
    const requestOptions: RequestInit = {
        ...options,
        credentials: "include",
        headers: buildRequestHeaders(options),
    };

    try {
        response = await fetch(url, requestOptions);
    } catch (error) {
        const message = error instanceof Error ? `Network request failed: ${error.message}` : "Network request failed";

        throw new ApiError(message);
    }

    if (!response.ok) {
      const errorData: unknown = await response.json().catch(() => null);
      const message = getErrorMessage(errorData) ?? `API request failed with status ${response.status}`;

      throw new ApiError (
        message, 
        response.status, 
        errorData
        );
    }

    if(response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
}

function buildRequestHeaders(options: RequestInit): Headers {
    const headers = new Headers(options.headers);

    if (!headers.has("Accept")) {
        headers.set("Accept", "application/json");
    }

    if (shouldSendXsrfHeader(options.method)) {
        const xsrfToken = getCookie("XSRF-TOKEN");

        if (xsrfToken !== null && !headers.has("X-XSRF-TOKEN")) {
            headers.set("X-XSRF-TOKEN", xsrfToken);
        }
    }

    return headers;
}

function shouldSendXsrfHeader(method: string | undefined): boolean {
    const normalizedMethod = method?.toUpperCase() ?? "GET";

    return ["POST", "PUT", "PATCH", "DELETE"].includes(normalizedMethod);
}

function getCookie(name: string): string | null {
    if (typeof document === "undefined") {
        return null;
    }

    const cookie = document.cookie
        .split("; ")
        .find((item) => item.startsWith(`${name}=`));

    if (!cookie) {
        return null;
    }

    return decodeURIComponent(cookie.slice(name.length + 1));
}

function getErrorMessage(errorData: unknown): string | null {
    if (
        typeof errorData === "object" 
        && errorData !== null 
        && "message" in errorData 
        && typeof errorData.message === "string"
    ) {
        return errorData.message;
    }

    return null;
}
