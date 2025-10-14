/**
 * Error codes for consistent error handling across the application
 */

export enum ErrorCode {
  // Authentication errors
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  VALUE_TOO_LONG = 'VALUE_TOO_LONG',
  VALUE_TOO_SHORT = 'VALUE_TOO_SHORT',
  
  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  MEMO_NOT_FOUND = 'MEMO_NOT_FOUND',
  CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND',
  QUIZ_SESSION_NOT_FOUND = 'QUIZ_SESSION_NOT_FOUND',
  
  // Conflict errors
  CONFLICT = 'CONFLICT',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  CATEGORY_NAME_EXISTS = 'CATEGORY_NAME_EXISTS',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  
  // Permission errors
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_ACCESS_DENIED = 'RESOURCE_ACCESS_DENIED',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Server errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Sync errors
  SYNC_CONFLICT = 'SYNC_CONFLICT',
  SYNC_FAILED = 'SYNC_FAILED',
  OFFLINE_ERROR = 'OFFLINE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Business logic errors
  INSUFFICIENT_MEMOS_FOR_QUIZ = 'INSUFFICIENT_MEMOS_FOR_QUIZ',
  QUIZ_SESSION_ALREADY_COMPLETED = 'QUIZ_SESSION_ALREADY_COMPLETED',
  INVALID_QUIZ_STATE = 'INVALID_QUIZ_STATE',
  CATEGORY_HAS_MEMOS = 'CATEGORY_HAS_MEMOS',
  
  // File/Upload errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  
  // Unknown/Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  OPERATION_FAILED = 'OPERATION_FAILED'
}

/**
 * HTTP status codes mapping for error codes
 */
export const ERROR_HTTP_STATUS: Record<ErrorCode, number> = {
  // Authentication errors (401)
  [ErrorCode.AUTHENTICATION_ERROR]: 401,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.TOKEN_INVALID]: 401,
  [ErrorCode.EMAIL_NOT_VERIFIED]: 401,
  [ErrorCode.ACCOUNT_LOCKED]: 401,
  
  // Authorization errors (403)
  [ErrorCode.AUTHORIZATION_ERROR]: 403,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  [ErrorCode.RESOURCE_ACCESS_DENIED]: 403,
  
  // Validation errors (400)
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.INVALID_FORMAT]: 400,
  [ErrorCode.VALUE_TOO_LONG]: 400,
  [ErrorCode.VALUE_TOO_SHORT]: 400,
  [ErrorCode.INVALID_FILE_TYPE]: 400,
  
  // Not found errors (404)
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.MEMO_NOT_FOUND]: 404,
  [ErrorCode.CATEGORY_NOT_FOUND]: 404,
  [ErrorCode.QUIZ_SESSION_NOT_FOUND]: 404,
  
  // Conflict errors (409)
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 409,
  [ErrorCode.CATEGORY_NAME_EXISTS]: 409,
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 409,
  [ErrorCode.SYNC_CONFLICT]: 409,
  
  // Rate limiting (429)
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.TOO_MANY_REQUESTS]: 429,
  [ErrorCode.QUOTA_EXCEEDED]: 429,
  
  // Business logic errors (422)
  [ErrorCode.INSUFFICIENT_MEMOS_FOR_QUIZ]: 422,
  [ErrorCode.QUIZ_SESSION_ALREADY_COMPLETED]: 422,
  [ErrorCode.INVALID_QUIZ_STATE]: 422,
  [ErrorCode.CATEGORY_HAS_MEMOS]: 422,
  [ErrorCode.FILE_TOO_LARGE]: 422,
  
  // Server errors (500)
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.UNKNOWN_ERROR]: 500,
  [ErrorCode.OPERATION_FAILED]: 500,
  
  // Service unavailable (503)
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 503,
  [ErrorCode.SYNC_FAILED]: 503,
  [ErrorCode.OFFLINE_ERROR]: 503,
  [ErrorCode.NETWORK_ERROR]: 503,
  [ErrorCode.UPLOAD_FAILED]: 503
};

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Authentication errors
  [ErrorCode.AUTHENTICATION_ERROR]: 'Authentication failed. Please log in again.',
  [ErrorCode.AUTHORIZATION_ERROR]: 'You do not have permission to perform this action.',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password.',
  [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
  [ErrorCode.TOKEN_INVALID]: 'Invalid authentication token.',
  [ErrorCode.EMAIL_NOT_VERIFIED]: 'Please verify your email address before continuing.',
  [ErrorCode.ACCOUNT_LOCKED]: 'Your account has been temporarily locked.',
  
  // Validation errors
  [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ErrorCode.INVALID_INPUT]: 'Invalid input provided.',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing.',
  [ErrorCode.INVALID_FORMAT]: 'Invalid format provided.',
  [ErrorCode.VALUE_TOO_LONG]: 'Value is too long.',
  [ErrorCode.VALUE_TOO_SHORT]: 'Value is too short.',
  
  // Resource errors
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'Resource not found.',
  [ErrorCode.USER_NOT_FOUND]: 'User not found.',
  [ErrorCode.MEMO_NOT_FOUND]: 'Memo not found.',
  [ErrorCode.CATEGORY_NOT_FOUND]: 'Category not found.',
  [ErrorCode.QUIZ_SESSION_NOT_FOUND]: 'Quiz session not found.',
  
  // Conflict errors
  [ErrorCode.CONFLICT]: 'A conflict occurred while processing your request.',
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 'An account with this email already exists.',
  [ErrorCode.CATEGORY_NAME_EXISTS]: 'A category with this name already exists.',
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 'This resource already exists.',
  
  // Permission errors
  [ErrorCode.FORBIDDEN]: 'Access denied.',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'You do not have sufficient permissions.',
  [ErrorCode.RESOURCE_ACCESS_DENIED]: 'Access to this resource is denied.',
  
  // Rate limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
  [ErrorCode.TOO_MANY_REQUESTS]: 'Too many requests. Please slow down.',
  [ErrorCode.QUOTA_EXCEEDED]: 'Usage quota exceeded.',
  
  // Server errors
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'An internal server error occurred.',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable.',
  [ErrorCode.DATABASE_ERROR]: 'Database error occurred.',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service error.',
  
  // Sync errors
  [ErrorCode.SYNC_CONFLICT]: 'Sync conflict detected. Please resolve conflicts.',
  [ErrorCode.SYNC_FAILED]: 'Synchronization failed.',
  [ErrorCode.OFFLINE_ERROR]: 'This action requires an internet connection.',
  [ErrorCode.NETWORK_ERROR]: 'Network error occurred.',
  
  // Business logic errors
  [ErrorCode.INSUFFICIENT_MEMOS_FOR_QUIZ]: 'You need at least 5 memos to start a quiz.',
  [ErrorCode.QUIZ_SESSION_ALREADY_COMPLETED]: 'This quiz session is already completed.',
  [ErrorCode.INVALID_QUIZ_STATE]: 'Invalid quiz state.',
  [ErrorCode.CATEGORY_HAS_MEMOS]: 'Cannot delete category that contains memos.',
  
  // File/Upload errors
  [ErrorCode.FILE_TOO_LARGE]: 'File size is too large.',
  [ErrorCode.INVALID_FILE_TYPE]: 'Invalid file type.',
  [ErrorCode.UPLOAD_FAILED]: 'File upload failed.',
  
  // Unknown/Generic errors
  [ErrorCode.UNKNOWN_ERROR]: 'An unknown error occurred.',
  [ErrorCode.OPERATION_FAILED]: 'Operation failed.'
};