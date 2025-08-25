/**
 * Custom API Error class for handling application-specific errors
 */
export class ApiError extends Error {
  public statusCode: number;
  public errors?: any[];
  public isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    errors?: any[],
    isOperational: boolean = true,
    stack?: string
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
    
    // Set the prototype explicitly to maintain instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Create a BadRequest error (400)
   */
  static badRequest(message: string, errors?: any[]): ApiError {
    return new ApiError(400, message, errors);
  }

  /**
   * Create an Unauthorized error (401)
   */
  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  /**
   * Create a Forbidden error (403)
   */
  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  /**
   * Create a NotFound error (404)
   */
  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  /**
   * Create a Conflict error (409)
   */
  static conflict(message: string, errors?: any[]): ApiError {
    return new ApiError(409, message, errors);
  }

  /**
   * Create a Validation error (422)
   */
  static validation(message: string, errors?: any[]): ApiError {
    return new ApiError(422, message, errors);
  }

  /**
   * Create an Internal Server Error (500)
   */
  static internal(message: string = 'Internal Server Error'): ApiError {
    return new ApiError(500, message, undefined, false);
  }

  /**
   * Create a Service Unavailable error (503)
   */
  static serviceUnavailable(message: string = 'Service Unavailable'): ApiError {
    return new ApiError(503, message);
  }

  /**
   * Create a Rate Limit error (429)
   */
  static tooManyRequests(message: string = 'Too Many Requests'): ApiError {
    return new ApiError(429, message);
  }

  /**
   * Convert the error to a JSON representation
   */
  toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errors: this.errors,
      isOperational: this.isOperational,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }
}