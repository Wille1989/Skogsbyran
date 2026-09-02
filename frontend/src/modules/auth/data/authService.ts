import type { User, AuthResponse, AuthUser } from "./userTypes";
import { baseURL } from '@/shared/data/baseURL';
import { apiFetch, ApiError } from "@/shared/data/apiFetch";

type AuthEnvelope<T> = {
    data: T;
};

export function AuthService() {
    async function initializeCsrf(): Promise<void> {
        await apiFetch<void>(`${baseURL}/sanctum/csrf-cookie`, {
            method: "GET",
        });
    }

    async function loginUser(form: User): Promise<AuthResponse> {
        await initializeCsrf();

        const response = await apiFetch<AuthEnvelope<AuthResponse>>(`${baseURL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(form)
        });

        return response.data;
    }

    async function logoutUser(): Promise<void> {
        try {
            await apiFetch<void>(`${baseURL}/auth/logout`, {
                method: 'POST',
            });
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                return;
            }

            throw error;
        }
    }

    async function getCurrentUser(): Promise<AuthUser | null> {
        try {
            const response = await apiFetch<AuthEnvelope<AuthUser>>(`${baseURL}/auth/me`, {
                method: "GET",
            });

            return response.data;
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                return null;
            }

            throw error;
        }
    }

    return { loginUser, logoutUser, getCurrentUser }
}
