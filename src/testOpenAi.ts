
import OpenAI from 'openai';
import { env as opeAiEnv } from './openAi_config'; 

const openai = new OpenAI({
  apiKey: opeAiEnv.openAi_key,
  organization : opeAiEnv.openAi_Organization,
  project : opeAiEnv.openAi_DefaultProject
});

const completion = openai.chat.completions.create({
  model: "gpt-4o-mini",
  store: true,
  messages: [
    {"role": "user", "content": "write a haiku about ai"},
  ],
});

completion.then((result) => console.log(result.choices[0].message));