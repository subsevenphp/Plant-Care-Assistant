// User-related TypeScript interfaces and types

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
  profileImage?: string;
  timezone: string;
  notificationPrefs: NotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  sms: boolean;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  timezone?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  timezone?: string;
  notificationPrefs?: NotificationPreferences;
}

export interface UserProfile extends Omit<User, 'id'> {
  plantCount: number;
  joinedDays: number;
}