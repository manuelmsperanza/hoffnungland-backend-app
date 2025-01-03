import { z } from 'zod';
import * as dotenv from 'dotenv';
dotenv.config(); // Load .env

// Define a schema for your environment variables:
const envSchema = z.object({
  mail_port: z.string().optional(),
  mail_host: z.string().default('localhost'),
  mail_secure: z.string().default('false'),
  mail_username: z.string().default('root'),
  mail_passwd: z.string().default(''),
  mail_default_receiver: z.string(),
  mail_debug: z.string().default('false'),
  mail_logger: z.string().default('false'),
});

const _env = envSchema.safeParse(process.env);
if (!_env.success) {
  console.error('Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data; 
// env is now strongly typed; e.g., env.DB_HOST is a string, env.PORT is optional