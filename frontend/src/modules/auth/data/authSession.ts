export type AuthSession = {
    token: string | null;
};

export function getStoredAuthSession(): AuthSession {
    if (typeof window === "undefined") {
        return {
            token: null,
        };
    }

    return {
        token: localStorage.getItem("token"),
    };
}

export function hasAuthToken(session: AuthSession): boolean {
    return typeof session.token === "string" && session.token.length > 0;
}

export function buildAuthHeaders(headers: HeadersInit = {}): HeadersInit {
    const { token } = getStoredAuthSession();
    const baseHeaders = {
        Accept: "application/json",
        ...headers,
    };

    if (!token) {
        return baseHeaders;
    }

    return {
        ...baseHeaders,
        Authorization: `Bearer ${token}`,
    };
}
