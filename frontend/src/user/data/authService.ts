import type { User, AuthResponse } from "./userTypes";
import { baseURL } from '../../shared/data/baseURL';
import { buildAuthHeaders } from "./authSession";

export function AuthService() {

    async function loginUser(form: User): Promise<AuthResponse> {
        const response = await fetch(`${baseURL}/auth/login`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(form)
        });

        const user = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(user.message || 'Något gick fel vid inloggning');
        };

        return user.data;
    }

    async function logoutUser(): Promise<void> {
        const response = await fetch(`${baseURL}/auth/logout`, {
            method: 'POST',
            headers: buildAuthHeaders(),
        });

        if (!response.ok && response.status !== 401) {
            const body: unknown = await response.json().catch(() => ({}));
            const message = typeof body === "object"
                && body !== null
                && "message" in body
                && typeof body.message === "string"
                ? body.message
                : 'Något gick fel vid utloggning';

            throw new Error(message);
        }
    }

    return { loginUser, logoutUser }
}
