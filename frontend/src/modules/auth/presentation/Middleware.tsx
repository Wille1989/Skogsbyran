import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useCurrentUserQuery } from "../data/auth.hooks.ts";
import "@/shared/presentation/spinner.css";

export function AdminRoute({ children }: { children: ReactNode }) {
    const { data: currentUser, isPending } = useCurrentUserQuery();

    if (isPending) {
        return <div className="spinner" />;
    }

    if (!currentUser?.isAdmin) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
