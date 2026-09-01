import type { User, AuthResponse } from "./userTypes";
import { baseURL } from '../../shared/data/baseURL';

export function AuthService() {

    async function loginUser(form: User): Promise<AuthResponse> {
        const response = await fetch(`${baseURL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });

        const user = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(user.error || 'Något gick fel vid inloggning');
        };

        return user.data;
    }

    return { loginUser }
}