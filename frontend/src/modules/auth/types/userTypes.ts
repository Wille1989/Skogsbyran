export type User = {
    email: string;
    password: string;
}

export type AuthUser = {
  id: number;
  email: string;
  isAdmin: boolean;
};

export type AuthResponse = AuthUser;
