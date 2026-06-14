import { api } from "./api";
import type { AuthRequest, AuthResponse, UserRequest } from "../types/auth";

export const authService = {
  async login(data: AuthRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", data);
    return response.data;
  },

  async register(data: UserRequest): Promise<void> {
    await api.post("/users", data);
  }
};