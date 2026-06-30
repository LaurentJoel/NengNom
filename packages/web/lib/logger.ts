const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  info: (...args: unknown[]) => {
    if (isDev) console.info('[neng-nom]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn('[neng-nom]', ...args);
  },
  error: (...args: unknown[]) => {
    if (isDev) console.error('[neng-nom]', ...args);
  },
};
