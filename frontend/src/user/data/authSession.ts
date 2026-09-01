export type AuthSession = {
    token: string | null;
    authUser: string | null;
};

type AuthUser = {
    isAdmin: boolean;
};

type TokenPayload = {
    exp?: number;
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
    return isSessionTokenCurrent(session.token);
}

export function isAdminSession(session: AuthSession): boolean {
    return isAuthenticated(session) && (parseAuthUser(session.authUser)?.isAdmin ?? false);
}

export function isCurrentUserAdmin(): boolean {
    return isAdminSession(
        getStoredAuthSession()
    );
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

function isSessionTokenCurrent(token: string | null): boolean {
    const payload = parseTokenPayload(token);

    if (!payload || typeof payload.exp !== "number") {
        return false;
    }

    return payload.exp > Math.floor(Date.now() / 1000);
}

function parseTokenPayload(token: string | null): TokenPayload | null {
    if (!token) {
        return null;
    }

    const [, payload] = token.split(".");

    if (!payload) {
        return null;
    }

    try {
        const normalizedPayload = payload
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(Math.ceil(payload.length / 4) * 4, "=");
        const parsed: unknown = JSON.parse(atob(normalizedPayload));

        if (typeof parsed !== "object" || parsed === null) {
            return null;
        }

        return parsed as TokenPayload;
    } catch {
        return null;
    }
}
