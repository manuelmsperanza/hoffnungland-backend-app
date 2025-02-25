import { z } from 'zod';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';
dotenv.config(); // Load .env

// Define a schema for your environment variables:
const envSchema = z.object({
  openAi_key: z.string().default(''),
  openAi_Organization: z.string().default(''),
  openAi_DefaultProject: z.string().default(''),
  openAi_ResumeAssistant: z.string().default('')
});

const _env = envSchema.safeParse(process.env);
if (!_env.success) {
  console.error('Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data; 
