import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getStoredAuthSession, isAdminSession } from "../data/authSession.ts";

export function AdminRoute({ children }: { children: ReactNode }) {
    const session = getStoredAuthSession();

    if (!isAdminSession(session)) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
