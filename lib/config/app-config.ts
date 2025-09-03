/**
 * Application configuration constants
 */

export const AppConfig = {
  poll: {
    maxOptions: 10,
    minOptions: 2,
    maxTitleLength: 200,
    maxDescriptionLength: 1000,
    defaultExpirationDays: 30,
  },
  auth: {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },
  database: {
    retryAttempts: 3,
    timeout: 5000,
    maxConnections: 10,
  },
  api: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
    },
    pagination: {
      defaultLimit: 20,
      maxLimit: 100,
    },
  },
  ui: {
    toast: {
      duration: 5000,
      position: 'top-right' as const,
    },
    animation: {
      duration: 300,
      easing: 'ease-in-out' as const,
    },
  },
  validation: {
    email: {
      maxLength: 254,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
    },
    username: {
      minLength: 3,
      maxLength: 30,
      pattern: /^[a-zA-Z0-9_-]+$/,
    },
  },
} as const;

export type AppConfigType = typeof AppConfig;

/**
 * Environment-specific configuration
 */
export const EnvConfig = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Alx-Polly',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },
  
  features: {
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    enableNotifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
    enableRealtime: process.env.NEXT_PUBLIC_ENABLE_REALTIME === 'true',
  },
} as const;

/**
 * Validate required environment variables
 */
export function validateEnvConfig() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Get configuration value with type safety
 */
export function getConfig<T extends keyof AppConfigType>(key: T): AppConfigType[T] {
  return AppConfig[key];
}

/**
 * Get environment configuration value
 */
export function getEnvConfig<T extends keyof typeof EnvConfig>(key: T): typeof EnvConfig[T] {
  return EnvConfig[key];
}
