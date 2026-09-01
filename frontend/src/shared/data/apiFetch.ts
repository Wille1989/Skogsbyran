export class ApiError extends Error {
    constructor(message: string, public readonly status?: number, public readonly details?: unknown) {
        super(message);
        this.name = "ApiError";
    }
}

export async function apiFetch<T>(url: string, options: RequestInit = {} ): Promise<T> {
    let response: Response;

    try {
        response = await fetch(url, options);
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