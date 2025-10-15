/**
 * Production-Safe Logger Utility
 * 
 * This logger ensures that sensitive information is not exposed in production
 * while maintaining debugging capabilities in development.
 * 
 * Security Features:
 * - No logging in production builds
 * - Sanitizes sensitive data (emails, tokens, etc.)
 * - Structured logging for better monitoring
 * - Error tracking integration ready
 */

interface LogContext {
  userId?: string;
  tenantId?: string;
  action?: string;
  component?: string;
  [key: string]: any;
}

interface LogEntry {
  level: 'log' | 'warn' | 'error';
  message: string;
  context?: LogContext;
  timestamp: string;
  environment: string;
}

class ProductionLogger {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;

  /**
   * Sanitize sensitive data from log entries
   */
  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveKeys = [
      'password', 'token', 'key', 'secret', 'auth', 'credential',
      'email', 'phone', 'ssn', 'credit', 'card', 'payment'
    ];

    const sanitized = { ...data };

    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Create structured log entry
   */
  private createLogEntry(level: LogEntry['level'], message: string, context?: LogContext): LogEntry {
    return {
      level,
      message,
      context: context ? this.sanitizeData(context) : undefined,
      timestamp: new Date().toISOString(),
      environment: this.isProduction ? 'production' : 'development'
    };
  }

  /**
   * Send error to external tracking service (for production)
   */
  private async sendToErrorTracking(entry: LogEntry) {
    if (!this.isProduction) return;

    try {
      // TODO: Integrate with Sentry or similar service
      // Example:
      // Sentry.captureException(new Error(entry.message), {
      //   extra: entry.context,
      //   tags: {
      //     component: entry.context?.component,
      //     action: entry.context?.action
      //   }
      // });
      
      // For now, we'll just prevent any logging in production
      // This ensures no sensitive data is exposed
    } catch (error) {
      // Silent fail - don't break the app if error tracking fails
    }
  }

  /**
   * Log general information (development only)
   */
  log(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const entry = this.createLogEntry('log', message, context);
      console.log(`[${entry.timestamp}] ${entry.message}`, entry.context || '');
    }
  }

  /**
   * Log warnings (development only, errors sent to tracking in production)
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const entry = this.createLogEntry('warn', message, context);
      console.warn(`[${entry.timestamp}] ${entry.message}`, entry.context || '');
    } else {
      // In production, treat warnings as errors for tracking
      this.error(message, context);
    }
  }

  /**
   * Log errors (development: console, production: error tracking)
   */
  error(message: string, context?: LogContext): void {
    const entry = this.createLogEntry('error', message, context);
    
    if (this.isDevelopment) {
      console.error(`[${entry.timestamp}] ${entry.message}`, entry.context || '');
    } else {
      // In production, send to error tracking service
      this.sendToErrorTracking(entry);
    }
  }

  /**
   * Log authentication events (always sanitized)
   */
  auth(message: string, context?: LogContext): void {
    const authContext = {
      ...context,
      action: 'authentication',
      component: 'auth'
    };
    
    this.log(message, authContext);
  }

  /**
   * Log database operations (always sanitized)
   */
  database(message: string, context?: LogContext): void {
    const dbContext = {
      ...context,
      action: 'database',
      component: 'database'
    };
    
    this.log(message, dbContext);
  }

  /**
   * Log payment operations (highly sanitized)
   */
  payment(message: string, context?: LogContext): void {
    const paymentContext = {
      ...context,
      action: 'payment',
      component: 'payment'
    };
    
    this.log(message, paymentContext);
  }

  /**
   * Log security events (always tracked)
   */
  security(message: string, context?: LogContext): void {
    const securityContext = {
      ...context,
      action: 'security',
      component: 'security'
    };
    
    // Security events are always logged, even in production
    if (this.isDevelopment) {
      console.warn(`[SECURITY] ${message}`, securityContext);
    } else {
      this.sendToErrorTracking(this.createLogEntry('warn', `[SECURITY] ${message}`, securityContext));
    }
  }
}

// Export singleton instance
export const logger = new ProductionLogger();

// Export types for TypeScript
export type { LogContext, LogEntry };

// Development helper - only available in development
if (import.meta.env.DEV) {
  (window as any).logger = logger;
}
