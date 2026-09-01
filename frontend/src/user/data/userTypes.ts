export type User = {
    email: string;
    password: string;
}

export type AuthResponse = {
  id: number;
  email: string;
  isAdmin: boolean;
  token: string;
};