import apiClient from './api';
import { User } from '../store/authStore';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      return response;
    } catch (error) {
      console.error('Login service error:', error);
      throw error;
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', userData);
      return response;
    } catch (error) {
      console.error('Register service error:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const response = await apiClient.post<{ accessToken: string }>('/auth/refresh', {
        refreshToken,
      });
      return response;
    } catch (error) {
      console.error('Token refresh service error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/auth/me');
      return response;
    } catch (error) {
      console.error('Get current user service error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint to invalidate tokens
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Log error but don't throw - we still want to clear local tokens
      console.error('Logout service error:', error);
    }
  }
}

export const authService = new AuthService();