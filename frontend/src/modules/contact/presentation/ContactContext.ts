import { createContext } from 'react';

// Lets page CTAs open the single panel owned by the shared layout.
export const ContactContext = createContext<(() => void) | null>(null);
