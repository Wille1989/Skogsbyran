import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from './authService';
import { getStoredAuthSession, isAdminSession } from './authSession';
import type { User } from './userTypes';

function getErrorMessage(error: unknown, fallbackMessage: string) {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallbackMessage;
}

export function useAuth() {
    const { loginUser, logoutUser } = AuthService();
    const navigate = useNavigate();

    const [form, setForm] = useState<User>({
        email: '',
        password: '',
    });

    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const onLogin = async (e: FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);
            setErrorMessage(null);
            setSuccessMessage(null);

            const userData = await loginUser(form);
            localStorage.setItem('token', userData.token);
            localStorage.setItem('authUser', JSON.stringify(userData));

            setSuccessMessage('Du loggas in!');
            await delay(1000);
            navigate('/dashboard/property/create');
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Kunde inte logga in användaren'));
        } finally {
            setLoading(false);
        }
    };

    const onLogout = async () => {
        try {
            setLoading(true);
            setErrorMessage(null);
            setSuccessMessage(null);

            await logoutUser();

            localStorage.removeItem('token');
            localStorage.removeItem('authUser');

            setSuccessMessage('Du loggas ut!');
            await delay(1000);
            navigate('/');
        } catch (error) {
            setErrorMessage(getErrorMessage(error, 'Kunde inte logga ut användaren'));
        } finally {
            setLoading(false);
        }
    };

    return {
        form,
        loading,
        isAdmin: isAdminSession(getStoredAuthSession()),
        successMessage,
        errorMessage,
        onChange,
        onLogin,
        onLogout,
    };
}
