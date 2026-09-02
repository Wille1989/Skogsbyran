import type { User, AuthResponse, AuthUser } from "./userTypes";
import { baseURL } from '@/shared/data/baseURL';
import { buildAuthHeaders } from "./authSession";
import { apiFetch, ApiError } from "@/shared/data/apiFetch";

type AuthEnvelope<T> = {
    data: T;
};

export function AuthService() {

    async function loginUser(form: User): Promise<AuthResponse> {
        const response = await apiFetch<AuthEnvelope<AuthResponse>>(`${baseURL}/auth/login`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
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
                headers: buildAuthHeaders(),
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
                headers: buildAuthHeaders(),
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
