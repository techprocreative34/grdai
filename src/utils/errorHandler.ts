// src/utils/errorHandler.ts
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    
    Error.captureStackTrace(this, this.constructor)
  }
}

export const handleApiError = (error: unknown): { message: string; statusCode: number } => {
  console.error('API Error:', error)
  
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode
    }
  }
  
  if (error instanceof Error) {
    // Don't expose internal errors in production
    const isProduction = process.env.NODE_ENV === 'production'
    return {
      message: isProduction ? 'Internal server error' : error.message,
      statusCode: 500
    }
  }
  
  return {
    message: 'An unexpected error occurred',
    statusCode: 500
  }
}

export const logError = (error: unknown, context?: string) => {
  const timestamp = new Date().toISOString()
  const errorInfo = {
    timestamp,
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error
  }
  
  // In production, send to logging service (e.g., Sentry, LogRocket)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with logging service
    console.error('Production Error:', JSON.stringify(errorInfo, null, 2))
  } else {
    console.error('Development Error:', errorInfo)
  }
}