/**
 * Comprehensive error handling and logging system
 */

export interface AppError {
  code: string;
  message: string;
  originalError?: Error;
  timestamp: string;
  context?: Record<string, unknown>;
  severity: "info" | "warning" | "error" | "critical";
}

/**
 * Error codes
 */
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: "NETWORK_ERROR",
  REQUEST_TIMEOUT: "REQUEST_TIMEOUT",
  CONNECTION_REFUSED: "CONNECTION_REFUSED",

  // API errors
  INVALID_API_KEY: "INVALID_API_KEY",
  API_QUOTA_EXCEEDED: "API_QUOTA_EXCEEDED",
  API_RATE_LIMIT: "API_RATE_LIMIT",
  UNSUPPORTED_MODEL: "UNSUPPORTED_MODEL",

  // Validation errors
  VALIDATION_FAILED: "VALIDATION_FAILED",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",

  // Storage errors
  STORAGE_ERROR: "STORAGE_ERROR",
  ENCRYPTION_ERROR: "ENCRYPTION_ERROR",
  DECRYPTION_ERROR: "DECRYPTION_ERROR",

  // Permission errors
  PERMISSION_DENIED: "PERMISSION_DENIED",

  // Unknown errors
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
};

/**
 * Parse error messages to extract error codes
 */
export function parseErrorResponse(error: unknown): AppError {
  const timestamp = new Date().toISOString();

  // Handle string errors
  if (typeof error === "string") {
    return {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: error,
      timestamp,
      severity: "error",
    };
  }

  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message;

    // API key errors
    if (message.includes("401") || message.includes("Unauthorized") || message.includes("invalid API key")) {
      return {
        code: ERROR_CODES.INVALID_API_KEY,
        message: "Your API key is invalid or expired. Please update it in settings.",
        originalError: error,
        timestamp,
        severity: "error",
      };
    }

    // Rate limit/Quota errors
    if (message.includes("429") || message.includes("rate limit")) {
      return {
        code: ERROR_CODES.API_RATE_LIMIT,
        message: "API rate limit exceeded. Please wait a few minutes before trying again.",
        originalError: error,
        timestamp,
        severity: "warning",
      };
    }

    if (message.includes("quota")) {
      return {
        code: ERROR_CODES.API_QUOTA_EXCEEDED,
        message: "API quota exceeded. Please check your API account.",
        originalError: error,
        timestamp,
        severity: "error",
      };
    }

    // Network errors
    if (message.includes("network") || message.includes("ECONNREFUSED")) {
      return {
        code: ERROR_CODES.NETWORK_ERROR,
        message: "Network connection failed. Please check your internet connection.",
        originalError: error,
        timestamp,
        severity: "warning",
      };
    }

    if (message.includes("timeout")) {
      return {
        code: ERROR_CODES.REQUEST_TIMEOUT,
        message: "Request timed out. Please try again.",
        originalError: error,
        timestamp,
        severity: "warning",
      };
    }

    // Encryption/Decryption errors
    if (message.includes("encrypt") || message.includes("decrypt")) {
      return {
        code: ERROR_CODES.ENCRYPTION_ERROR,
        message: "Failed to process your API key. Please try setting it up again.",
        originalError: error,
        timestamp,
        severity: "error",
      };
    }

    // Default
    return {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: message || "An unexpected error occurred",
      originalError: error,
      timestamp,
      severity: "error",
    };
  }

  // Handle unknown error types
  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: "An unexpected error occurred. Please try again.",
    timestamp,
    severity: "error",
  };
}

/**
 * Log error with context
 */
export function logError(error: unknown, context?: Record<string, unknown>): AppError {
  const appError = parseErrorResponse(error);
  appError.context = context;

  // Log to console in development
  if (__DEV__) {
    console.error(`[${appError.code}]`, appError.message, context);
  }

  // Could send to error tracking service here (Sentry, etc.)
  // sendToErrorTracking(appError);

  return appError;
}

/**
 * Get user-friendly error message
 */
export function getUserErrorMessage(error: AppError): string {
  const messages: Record<string, string> = {
    [ERROR_CODES.INVALID_API_KEY]: "Your API key is invalid. Please check it again.",
    [ERROR_CODES.API_RATE_LIMIT]: "You're making requests too quickly. Please wait a moment.",
    [ERROR_CODES.API_QUOTA_EXCEEDED]: "API quota exceeded. Check your account.",
    [ERROR_CODES.NETWORK_ERROR]: "No internet connection. Please try again.",
    [ERROR_CODES.REQUEST_TIMEOUT]: "Request took too long. Please try again.",
    [ERROR_CODES.VALIDATION_FAILED]: "Please check your input and try again.",
    [ERROR_CODES.PERMISSION_DENIED]: "Permission denied. Update your app permissions.",
  };

  return messages[error.code] || error.message || "Something went wrong. Please try again.";
}

/**
 * Validate network connection
 */
export async function checkNetworkConnection(): Promise<boolean> {
  try {
    // Try a simple DNS lookup
    const response = await fetch("https://www.google.com", {
      method: "HEAD",
      mode: "no-cors",
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = baseDelay * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
}

/**
 * Handle API error response
 */
export function handleAPIError(response: Response): AppError {
  const statusCode = response.status;
  const message = response.statusText || `HTTP ${statusCode}`;

  if (statusCode === 401) {
    return {
      code: ERROR_CODES.INVALID_API_KEY,
      message: "Authentication failed. Please check your credentials.",
      timestamp: new Date().toISOString(),
      severity: "error",
    };
  }

  if (statusCode === 429) {
    return {
      code: ERROR_CODES.API_RATE_LIMIT,
      message: "Too many requests. Please wait before trying again.",
      timestamp: new Date().toISOString(),
      severity: "warning",
    };
  }

  if (statusCode >= 500) {
    return {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: "Server error. Please try again later.",
      timestamp: new Date().toISOString(),
      severity: "error",
    };
  }

  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: `Request failed: ${message}`,
    timestamp: new Date().toISOString(),
    severity: "error",
  };
}

/**
 * Sanitize error for display (remove sensitive info)
 */
export function sanitizeError(error: AppError): AppError {
  return {
    ...error,
    message: error.message.replace(/sk-[A-Za-z0-9\-_]{20,}/g, "[KEY_REDACTED]"),
    context: error.context
      ? Object.entries(error.context).reduce(
          (acc, [key, value]) => {
            if (typeof value === "string" && value.includes("sk-")) {
              acc[key] = "[KEY_REDACTED]";
            } else {
              acc[key] = value;
            }
            return acc;
          },
          {} as Record<string, unknown>
        )
      : undefined,
  };
}

// Development flag
declare const __DEV__: boolean;
