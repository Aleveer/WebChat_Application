import { Logger } from '@nestjs/common';

const logger = new Logger('EnvValidation');

interface EnvValidationRule {
  key: string;
  required: boolean;
  type?: 'string' | 'number' | 'boolean' | 'url';
  minLength?: number;
  defaultValue?: string | number;
  description?: string;
}

const ENV_RULES: EnvValidationRule[] = [
  // Critical - JWT
  {
    key: 'JWT_SECRET',
    required: true,
    type: 'string',
    minLength: 32,
    description: 'JWT secret must be at least 32 characters for security',
  },
  {
    key: 'JWT_EXPIRES_IN',
    required: false,
    type: 'string',
    defaultValue: '7d',
  },
  {
    key: 'JWT_REFRESH_SECRET',
    required: false,
    type: 'string',
    minLength: 32,
  },

  // Critical - Database
  {
    key: 'MONGODB_URI',
    required: true,
    type: 'string',
    description: 'MongoDB connection URI is required',
  },

  // Application
  {
    key: 'NODE_ENV',
    required: false,
    type: 'string',
    defaultValue: 'development',
  },
  {
    key: 'PORT',
    required: false,
    type: 'number',
    defaultValue: 3000,
  },
  {
    key: 'BACKEND_PORT',
    required: false,
    type: 'number',
    defaultValue: 3000,
  },

  // Frontend
  {
    key: 'FRONTEND_URL',
    required: false,
    type: 'url',
    defaultValue: 'http://localhost:5173',
  },

  // Rate Limiting
  {
    key: 'RATE_LIMIT_TTL',
    required: false,
    type: 'number',
    defaultValue: 60000,
  },
  {
    key: 'RATE_LIMIT_LIMIT',
    required: false,
    type: 'number',
    defaultValue: 100,
  },

  // Cache
  {
    key: 'CACHE_TTL',
    required: false,
    type: 'number',
    defaultValue: 3600000,
  },
  {
    key: 'CACHE_MAX_ITEMS',
    required: false,
    type: 'number',
    defaultValue: 100,
  },

  // Database Pool
  {
    key: 'DB_MAX_POOL_SIZE',
    required: false,
    type: 'number',
    defaultValue: 10,
  },
  {
    key: 'DB_SERVER_SELECTION_TIMEOUT_MS',
    required: false,
    type: 'number',
    defaultValue: 5000,
  },
  {
    key: 'DB_SOCKET_TIMEOUT_MS',
    required: false,
    type: 'number',
    defaultValue: 45000,
  },
];

/**
 * Validate environment variables against rules
 * Throws error if validation fails
 */
export function validateEnvironment(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const rule of ENV_RULES) {
    const value = process.env[rule.key];

    // Check if required
    if (rule.required && !value) {
      errors.push(
        `${rule.key} is required${rule.description ? `: ${rule.description}` : ''}`,
      );
      continue;
    }

    // Set default if not provided
    if (!value && rule.defaultValue !== undefined) {
      process.env[rule.key] = String(rule.defaultValue);
      warnings.push(`${rule.key} not set, using default: ${rule.defaultValue}`);
      continue;
    }

    // Skip validation if not set and not required
    if (!value) continue;

    // Type validation
    if (rule.type === 'number') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        errors.push(`${rule.key} must be a valid number, got: ${value}`);
      }
    }

    if (rule.type === 'url') {
      try {
        new URL(value);
      } catch {
        warnings.push(`${rule.key} might not be a valid URL: ${value}`);
      }
    }

    // Min length validation
    if (rule.minLength && value.length < rule.minLength) {
      errors.push(
        `${rule.key} must be at least ${rule.minLength} characters, got ${value.length}`,
      );
    }
  }

  // Log warnings
  if (warnings.length > 0) {
    logger.warn('Environment Warnings:');
    warnings.forEach((warning) => logger.warn(`   - ${warning}`));
  }

  // Throw if errors
  if (errors.length > 0) {
    logger.error('❌ Environment Validation Failed:');
    errors.forEach((error) => logger.error(`   - ${error}`));
    logger.error(
      '\n💡 Tip: Copy .env.example to .env.local and fill in the values\n',
    );
    throw new Error('Environment validation failed');
  }

  logger.log('Environment validation passed');
}

/**
 * Get validated environment variable
 * Returns the value if valid, throws error otherwise
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;

  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }

  return value;
}

/**
 * Get validated number environment variable
 */
export function getEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];

  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not set`);
  }

  const numValue = Number(value);
  if (isNaN(numValue)) {
    throw new Error(
      `Environment variable ${key} must be a number, got: ${value}`,
    );
  }

  return numValue;
}

/**
 * Get validated boolean environment variable
 */
export function getEnvBoolean(key: string, defaultValue?: boolean): boolean {
  const value = process.env[key];

  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not set`);
  }

  return value.toLowerCase() === 'true';
}
