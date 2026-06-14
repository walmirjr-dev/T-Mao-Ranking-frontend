export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export interface UserRequest {
  name: string;
  email: string;
  password: string;
}