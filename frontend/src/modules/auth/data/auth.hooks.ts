import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AuthService } from './authService';
import type { AuthUser, User } from './userTypes';

export const authQueryKeys = {
    currentUser: ["auth", "currentUser"] as const,
};

function getErrorMessage(error: unknown, fallbackMessage: string) {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallbackMessage;
}

export function useAuth() {
    const { loginUser, logoutUser, getCurrentUser } = AuthService();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const currentUserQuery = useQuery({
        queryKey: authQueryKeys.currentUser,
        queryFn: getCurrentUser,
        retry: false,
        staleTime: 1000 * 60 * 5,
    });

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

            const authUser: AuthUser = {
                id: userData.id,
                email: userData.email,
                isAdmin: userData.isAdmin,
            };

            queryClient.setQueryData(authQueryKeys.currentUser, authUser);

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
            queryClient.setQueryData(authQueryKeys.currentUser, null);

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
        currentUser: currentUserQuery.data ?? null,
        isAuthenticated: currentUserQuery.data !== null,
        isAdmin: currentUserQuery.data?.isAdmin ?? false,
        isAuthPending: currentUserQuery.isPending,
        successMessage,
        errorMessage,
        onChange,
        onLogin,
        onLogout,
    };
}

export function useCurrentUserQuery() {
    const { getCurrentUser } = AuthService();

    return useQuery({
        queryKey: authQueryKeys.currentUser,
        queryFn: getCurrentUser,
        retry: false,
        staleTime: 1000 * 60 * 5,
    });
}
