import { z } from 'zod';
import * as dotenv from 'dotenv';
dotenv.config(); // Load .env

// Define a schema for your environment variables:
const envSchema = z.object({
  db_port: z.string().optional(),
  db_host: z.string().default('localhost'),
  db_username: z.string().default('root'),
  db_passwd: z.string().default(''),
  db_name: z.string().default('mydb'),
});

const _env = envSchema.safeParse(process.env);
if (!_env.success) {
  console.error('Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data; 
// env is now strongly typed; e.g., env.DB_HOST is a string, env.PORT is optional