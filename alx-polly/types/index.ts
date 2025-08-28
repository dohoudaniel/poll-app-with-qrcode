// User types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser extends User {
  isAuthenticated: boolean;
}

// Poll types
export interface PollOption {
  id: string;
  text: string;
  votes: number;
  pollId: string;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  options: PollOption[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  allowMultipleVotes: boolean;
  isAnonymous: boolean;
  totalVotes: number;
  qrCode?: string;
}

export interface PollVote {
  id: string;
  pollId: string;
  optionId: string;
  userId?: string; // Optional for anonymous votes
  ipAddress?: string;
  createdAt: Date;
}

// Form types
export interface CreatePollFormData {
  title: string;
  description?: string;
  options: string[];
  expiresAt?: Date;
  allowMultipleVotes: boolean;
  isAnonymous: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Component prop types
export interface PollCardProps {
  poll: Poll;
  onVote?: (pollId: string, optionId: string) => void;
  showResults?: boolean;
}

export interface AuthFormProps {
  onSubmit: (data: LoginFormData | RegisterFormData) => void;
  isLoading?: boolean;
  error?: string;
}

// Utility types
export type PollStatus = 'active' | 'expired' | 'draft';
export type UserRole = 'user' | 'admin';
export type VoteType = 'single' | 'multiple';
