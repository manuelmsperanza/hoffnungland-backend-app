
import OpenAI from 'openai';
import { env as openAiEnv } from './openAi_config'; 

const openai = new OpenAI({
  apiKey: openAiEnv.openAi_key,
  organization : openAiEnv.openAi_Organization,
  project : openAiEnv.openAi_DefaultProject
});

const completion = openai.chat.completions.create({
  model: "gpt-4o-mini",
  store: true,
  messages: [
    {"role": "user", "content": "write a haiku about ai"},
  ],
});

completion.then((result) => console.log(result.choices[0].message));