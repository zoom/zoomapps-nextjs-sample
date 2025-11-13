/**
 * Centralized error handling utilities
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = "UNKNOWN_ERROR",
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(
      message,
      field ? `VALIDATION_ERROR_${field.toUpperCase()}` : "VALIDATION_ERROR",
      400
    );
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed") {
    super(message, "AUTHENTICATION_ERROR", 401);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Access denied") {
    super(message, "AUTHORIZATION_ERROR", 403);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, "NOT_FOUND_ERROR", 404);
    this.name = "NotFoundError";
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(
      `${service} service error: ${message}`,
      `${service.toUpperCase()}_SERVICE_ERROR`,
      502
    );
    this.name = "ExternalServiceError";
  }
}

/**
 * Error handler for async operations
 */
export function handleAsyncError<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  return operation().catch((error) => {
    console.error(`Error in ${context || 'async operation'}:`, error);
    
    // Let Next.js redirect errors pass through
    if (error?.digest?.startsWith?.('NEXT_REDIRECT')) {
      throw error;
    }
    
    if (error instanceof AppError) {
      throw error;
    }
    
    // Convert unknown errors to AppError
    throw new AppError(
      error.message || "An unexpected error occurred",
      "UNKNOWN_ERROR",
      500,
      false
    );
  });
}

/**
 * Safe async wrapper that returns result or error
 */
export async function safeAsync<T, E = Error>(
  operation: () => Promise<T>
): Promise<[T | null, E | null]> {
  try {
    const result = await operation();
    return [result, null];
  } catch (error) {
    return [null, error as E];
  }
}

/**
 * Retry utility for operations that might fail temporarily
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        break;
      }

      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }

  throw new AppError(
    `Operation failed after ${maxAttempts} attempts: ${lastError!.message}`,
    "RETRY_EXHAUSTED",
    500
  );
}

/**
 * Log error with context
 */
export function logError(error: Error, context?: string, metadata?: Record<string, any>) {
  const errorInfo: any = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
    metadata,
    timestamp: new Date().toISOString(),
  };

  if (error instanceof AppError) {
    errorInfo.code = error.code;
    errorInfo.statusCode = error.statusCode;
    errorInfo.isOperational = error.isOperational;
  }

  console.error("Error occurred:", errorInfo);
}

/**
 * Create user-friendly error message
 */
export function getUserFriendlyMessage(error: Error): string {
  if (error instanceof ValidationError) {
    return error.message;
  }
  
  if (error instanceof AuthenticationError) {
    return "Please sign in to continue.";
  }
  
  if (error instanceof AuthorizationError) {
    return "You don't have permission to perform this action.";
  }
  
  if (error instanceof NotFoundError) {
    return error.message;
  }
  
  if (error instanceof ExternalServiceError) {
    return "A service is temporarily unavailable. Please try again later.";
  }
  
  if (error instanceof AppError && error.isOperational) {
    return error.message;
  }
  
  return "Something went wrong. Please try again later.";
}