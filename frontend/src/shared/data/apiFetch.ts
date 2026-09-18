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
        credentials: options.credentials ?? "include",
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

export type UploadProgress = { loaded: number; total: number | null; sent: boolean };

// Fetch does not expose browser upload progress. Keep session/error handling here
// and use the browser's native transport for multipart uploads that need it.
export function apiUpload<T>(url: string, body: FormData, onProgress: (progress: UploadProgress) => void): Promise<T> {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        let lastUpdate = 0;
        const report = (event: ProgressEvent, sent = false) => {
            const now = performance.now();
            if (!sent && now - lastUpdate < 250 && event.loaded !== event.total) return;
            lastUpdate = now;
            onProgress({ loaded: event.loaded, total: event.lengthComputable ? event.total : null, sent });
        };
        request.upload.onprogress = event => report(event);
        request.upload.onload = event => report(event, true);
        request.onerror = () => reject(new ApiError("Upload network failure"));
        request.onabort = () => reject(new ApiError("Upload interrupted"));
        request.ontimeout = () => reject(new ApiError("Upload timed out"));
        request.onload = () => {
            let data: unknown = null;
            try { data = request.responseText ? JSON.parse(request.responseText) as unknown : null; }
            catch { reject(new ApiError("Invalid upload response", request.status >= 400 ? request.status : undefined)); return; }
            if (request.status < 200 || request.status >= 300) {
                reject(new ApiError(getErrorMessage(data) ?? "Upload failed", request.status, data));
            } else if (data === null && request.status !== 204) {
                reject(new ApiError("Missing upload response"));
            } else resolve(data as T);
        };
        request.open("POST", url);
        request.withCredentials = true;
        buildRequestHeaders({ method: "POST" }).forEach((value, key) => request.setRequestHeader(key, value));
        request.send(body);
    });
}
