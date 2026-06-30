import winston from 'winston';
export declare const logger: any;
/**
 * Create a child logger with module context
 * All logs from this logger will include the module name
 */
export declare function createLogger(module: string): winston.Logger;
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
//# sourceMappingURL=logger.d.ts.map