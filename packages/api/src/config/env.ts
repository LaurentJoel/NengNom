import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().default(3001),

  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.coerce.number().default(900),
  JWT_REFRESH_TTL: z.coerce.number().default(604800),

  // AI
  GROQ_API_KEY: z.string().startsWith('gsk_'),
  GROQ_MODEL: z.string().default('llama-3.1-70b-versatile'),

  // Media
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),

  // Communications
  RESEND_API_KEY: z.string().startsWith('re_'),
  AFRICAS_TALKING_API_KEY: z.string(),
  AFRICAS_TALKING_USERNAME: z.string(),

  // App
  FRONTEND_URL: z.string().url(),
  ALLOWED_ORIGINS: z.string().transform((s) => s.split(',')),
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'debug'])
    .default('info'),
})

export type AppConfig = z.infer<typeof EnvSchema>

// Fail fast — crash on startup if any env var is missing or invalid
const parsed = EnvSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const config: AppConfig = parsed.data
