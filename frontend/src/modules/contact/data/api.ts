import { apiFetch } from '@/shared/data/apiFetch';
import { baseURL } from '@/shared/data/baseURL';

export type ContactValues = {
    name: string;
    email: string;
    phone: string;
    message: string;
    website: string;
};

export function sendContact(values: ContactValues): Promise<{ message: string }> {
    return apiFetch(`${baseURL}/contact`, {
        method: 'POST',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
    });
}
