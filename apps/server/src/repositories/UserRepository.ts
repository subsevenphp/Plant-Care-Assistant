import { User, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export interface CreateUserData {
  email: string;
  password: string;
  name?: string;
}

export interface UpdateUserData {
  name?: string;
  password?: string;
  refreshToken?: string;
}

/**
 * User Repository class for handling all User-related database operations
 */
export class UserRepository {
  /**
   * Create a new user
   * @param userData - The user data to create
   * @returns Promise<User> - The created user
   */
  async create(userData: CreateUserData): Promise<User> {
    try {
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: userData.password,
          name: userData.name,
        },
      });

      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('User with this email already exists');
        }
        throw new Error(`Failed to create user: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Find a user by email
   * @param email - The user's email
   * @returns Promise<User | null> - The found user or null
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: {
          email: email.toLowerCase(),
        },
      });

      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Failed to find user by email: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Find a user by ID
   * @param userId - The user's ID
   * @returns Promise<User | null> - The found user or null
   */
  async findById(userId: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Failed to find user by ID: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Update a user by ID
   * @param userId - The user's ID
   * @param updateData - The data to update
   * @returns Promise<User | null> - The updated user or null if not found
   */
  async update(userId: string, updateData: UpdateUserData): Promise<User | null> {
    try {
      const updatedUser = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return null; // User not found
        }
        if (error.code === 'P2002') {
          throw new Error('Email already in use');
        }
        throw new Error(`Failed to update user: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Delete a user by ID
   * @param userId - The user's ID
   * @returns Promise<boolean> - True if deleted, false if not found
   */
  async delete(userId: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: {
          id: userId,
        },
      });

      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return false; // User not found
        }
        throw new Error(`Failed to delete user: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Check if an email is already taken
   * @param email - The email to check
   * @param excludeUserId - User ID to exclude from the check (for updates)
   * @returns Promise<boolean> - True if email exists, false otherwise
   */
  async isEmailTaken(email: string, excludeUserId?: string): Promise<boolean> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          ...(excludeUserId && { id: { not: excludeUserId } }),
        },
      });

      return user !== null;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Failed to check email availability: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get user statistics
   * @param userId - The user's ID
   * @returns Promise<UserStats> - User statistics
   */
  async getUserStats(userId: string): Promise<{
    plantCount: number;
    accountAge: number;
    lastLogin: Date | null;
  }> {
    try {
      const [user, plantCount] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.plant.count({
          where: { userId },
        }),
      ]);

      if (!user) {
        throw new Error('User not found');
      }

      const accountAge = Math.floor(
        (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        plantCount,
        accountAge,
        lastLogin: user.updatedAt, // Using updatedAt as a proxy for last activity
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Failed to get user stats: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Update user's last login time
   * @param userId - The user's ID
   * @returns Promise<void>
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      // Don't throw error for last login update failures
      console.warn('Failed to update last login:', error);
    }
  }

  /**
   * Store refresh token for user
   * @param userId - The user's ID
   * @param refreshToken - The refresh token to store
   * @returns Promise<void>
   */
  async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    try {
      await this.update(userId, { refreshToken });
    } catch (error) {
      console.error('Failed to store refresh token:', error);
      throw new Error('Failed to store refresh token');
    }
  }

  /**
   * Clear refresh token for user
   * @param userId - The user's ID
   * @returns Promise<void>
   */
  async clearRefreshToken(userId: string): Promise<void> {
    try {
      await this.update(userId, { refreshToken: null });
    } catch (error) {
      console.error('Failed to clear refresh token:', error);
      throw new Error('Failed to clear refresh token');
    }
  }

  /**
   * Find user by refresh token
   * @param refreshToken - The refresh token
   * @returns Promise<User | null> - The found user or null
   */
  async findByRefreshToken(refreshToken: string): Promise<User | null> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          refreshToken,
        },
      });

      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Failed to find user by refresh token: ${error.message}`);
      }
      throw error;
    }
  }
}