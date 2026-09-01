export type AuthSession = {
    token: string | null;
    authUser: string | null;
};

type AuthUser = {
    isAdmin: boolean;
};

export function getStoredAuthSession(): AuthSession {
    if (typeof window === "undefined") {
        return {
            token: null,
            authUser: null,
        };
    }

    return {
        token: localStorage.getItem("token"),
        authUser: localStorage.getItem("authUser"),
    };
}

function parseAuthUser(
    authUser: string | null
): AuthUser | null {
    if (!authUser) {
        return null;
    }

    try {
        const parsed: unknown = JSON.parse(authUser);

        if (
            typeof parsed !== "object" ||
            parsed === null ||
            !("isAdmin" in parsed) ||
            typeof parsed.isAdmin !== "boolean"
        ) {
            return null;
        }

        return {
            isAdmin: parsed.isAdmin,
        };
    } catch {
        return null;
    }
}

export function isAuthenticated(session: AuthSession): boolean {
    return Boolean(session.token);
}

export function isAdminSession(session: AuthSession): boolean {
    return parseAuthUser(session.authUser)?.isAdmin ?? false;
}

export function isCurrentUserAdmin(): boolean {
    return isAdminSession(
        getStoredAuthSession()
    );
}

export function buildAuthHeaders(headers: HeadersInit = {}): HeadersInit {
    const { token } = getStoredAuthSession();

    if (!token) {
        return headers;
    }

    return {
        ...headers,
        Authorization: `Bearer ${token}`,
    };
}