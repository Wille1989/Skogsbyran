import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useCurrentUserQuery } from "../hooks/auth.hooks.ts";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner.tsx";

export function AdminRoute({ children }: { children: ReactNode }) {
    const { data: currentUser, isPending } = useCurrentUserQuery();

    if (isPending) {
        return <LoadingSpinner />;
    }

    if (!currentUser?.isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
