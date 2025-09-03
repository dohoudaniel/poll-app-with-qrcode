/**
 * Centralized authentication service
 */

import { NextRequest } from 'next/server';
import { supabase } from '../supabase';
import { Logger } from '../utils/logger';
import {
  AuthenticationError,
  UnauthorizedError,
  InvalidCredentialsError,
  UserNotFoundError,
} from '../errors/custom-errors';
import type { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Authentication service class
 */
export class AuthService {
  /**
   * Get current user from session
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        Logger.warn('Failed to get current user', { error: error.message });
        return null;
      }
      
      if (!user) {
        return null;
      }
      
      // Get additional user data from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, first_name, last_name, created_at, updated_at')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        Logger.warn('Failed to get user profile', {
          userId: user.id,
          error: profileError.message,
        });
      }
      
      return {
        id: user.id,
        email: user.email!,
        username: profile?.username,
        firstName: profile?.first_name,
        lastName: profile?.last_name,
        createdAt: profile?.created_at || user.created_at,
        updatedAt: profile?.updated_at || user.updated_at || user.created_at,
      };
    } catch (error) {
      Logger.error('Error getting current user', error as Error);
      return null;
    }
  }
  
  /**
   * Get current session
   */
  static async getCurrentSession(): Promise<AuthSession | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        Logger.warn('Failed to get current session', { error: error.message });
        return null;
      }
      
      if (!session) {
        return null;
      }
      
      const user = await this.getCurrentUser();
      if (!user) {
        return null;
      }
      
      return {
        user,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at || 0,
      };
    } catch (error) {
      Logger.error('Error getting current session', error as Error);
      return null;
    }
  }
  
  /**
   * Validate session from request
   */
  static async validateSession(request: NextRequest): Promise<AuthUser | null> {
    try {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
      }
      
      const token = authHeader.substring(7);
      
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        Logger.warn('Invalid session token', { error: error?.message });
        return null;
      }
      
      // Get additional user data
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, first_name, last_name, created_at, updated_at')
        .eq('id', user.id)
        .single();
      
      return {
        id: user.id,
        email: user.email!,
        username: profile?.username,
        firstName: profile?.first_name,
        lastName: profile?.last_name,
        createdAt: profile?.created_at || user.created_at,
        updatedAt: profile?.updated_at || user.updated_at || user.created_at,
      };
    } catch (error) {
      Logger.error('Error validating session', error as Error);
      return null;
    }
  }
  
  /**
   * Require authentication - throws if not authenticated
   */
  static async requireAuth(request: NextRequest): Promise<AuthUser> {
    const user = await this.validateSession(request);
    
    if (!user) {
      Logger.security('Unauthorized access attempt', 'medium', {
        url: request.url,
        method: request.method,
        userAgent: request.headers.get('user-agent'),
      });
      throw new AuthenticationError('Authentication required');
    }
    
    return user;
  }
  
  /**
   * Login with email and password
   */
  static async login(credentials: LoginCredentials): Promise<AuthSession> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      
      if (error) {
        Logger.auth('Login failed', undefined, {
          email: credentials.email,
          error: error.message,
        });
        throw new InvalidCredentialsError(error.message);
      }
      
      if (!data.session || !data.user) {
        throw new InvalidCredentialsError('Login failed');
      }
      
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, first_name, last_name, created_at, updated_at')
        .eq('id', data.user.id)
        .single();
      
      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email!,
        username: profile?.username,
        firstName: profile?.first_name,
        lastName: profile?.last_name,
        createdAt: profile?.created_at || data.user.created_at,
        updatedAt: profile?.updated_at || data.user.updated_at || data.user.created_at,
      };
      
      Logger.auth('User logged in', data.user.id, {
        email: credentials.email,
      });
      
      return {
        user: authUser,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at || 0,
      };
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw error;
      }
      
      Logger.error('Login error', error as Error, {
        email: credentials.email,
      });
      throw new InvalidCredentialsError('Login failed');
    }
  }
  
  /**
   * Register new user
   */
  static async register(data: RegisterData): Promise<AuthSession> {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      
      if (error) {
        Logger.auth('Registration failed', undefined, {
          email: data.email,
          error: error.message,
        });
        throw new InvalidCredentialsError(error.message);
      }
      
      if (!authData.session || !authData.user) {
        throw new InvalidCredentialsError('Registration failed');
      }
      
      // Create user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: data.username,
          first_name: data.firstName,
          last_name: data.lastName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      if (profileError) {
        Logger.error('Failed to create user profile', new Error(profileError.message), {
          userId: authData.user.id,
          email: data.email,
        });
      }
      
      const authUser: AuthUser = {
        id: authData.user.id,
        email: authData.user.email!,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        createdAt: authData.user.created_at,
        updatedAt: authData.user.updated_at || authData.user.created_at,
      };
      
      Logger.auth('User registered', authData.user.id, {
        email: data.email,
        username: data.username,
      });
      
      return {
        user: authUser,
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        expiresAt: authData.session.expires_at || 0,
      };
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw error;
      }
      
      Logger.error('Registration error', error as Error, {
        email: data.email,
      });
      throw new InvalidCredentialsError('Registration failed');
    }
  }
  
  /**
   * Logout current user
   */
  static async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        Logger.warn('Logout failed', { error: error.message });
        throw new Error(error.message);
      }
      
      Logger.auth('User logged out');
    } catch (error) {
      Logger.error('Logout error', error as Error);
      throw error;
    }
  }
  
  /**
   * Refresh session
   */
  static async refreshSession(): Promise<AuthSession | null> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        Logger.warn('Session refresh failed', { error: error?.message });
        return null;
      }
      
      const user = await this.getCurrentUser();
      if (!user) {
        return null;
      }
      
      Logger.auth('Session refreshed', user.id);
      
      return {
        user,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at || 0,
      };
    } catch (error) {
      Logger.error('Session refresh error', error as Error);
      return null;
    }
  }
  
  /**
   * Check if user owns resource
   */
  static async checkOwnership(
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from(resourceType)
        .select('created_by')
        .eq('id', resourceId)
        .single();
      
      if (error || !data) {
        return false;
      }
      
      return data.created_by === userId;
    } catch (error) {
      Logger.error('Ownership check error', error as Error, {
        userId,
        resourceType,
        resourceId,
      });
      return false;
    }
  }
  
  /**
   * Require resource ownership
   */
  static async requireOwnership(
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<void> {
    const isOwner = await this.checkOwnership(userId, resourceType, resourceId);
    
    if (!isOwner) {
      Logger.security('Unauthorized resource access attempt', 'high', {
        userId,
        resourceType,
        resourceId,
      });
      throw new UnauthorizedError(`access ${resourceType} ${resourceId}`);
    }
  }
}
