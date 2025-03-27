import OpenAI from 'openai';
import { env as openAiEnv } from './openAi_config'; 

const openai = new OpenAI({
  apiKey: openAiEnv.openAi_key,
  organization : openAiEnv.openAi_Organization,
  project : openAiEnv.openAi_DefaultProject
});

async function enquiry(thread: any, userMessage: string) {

    const message = await openai.beta.threads.messages.create(
        thread.id,
        {
          role: "user",
          content: userMessage
        }
      );
  
      let run = await openai.beta.threads.runs.createAndPoll(
          thread.id,
          { 
            assistant_id: openAiEnv.openAi_ResumeAssistant
          }
        );
        console.log(run.thread_id + ' ' + run.usage.total_tokens);
        if (run.status === 'completed') {
          const messages = await openai.beta.threads.messages.list(
            run.thread_id,
            {run_id : run.id}
          );
          for (const message of messages.data.reverse()) {
              //console.log(message)
              if ('text' in message.content[0]) {
                  console.log(`${message.role} > ${message.content[0].text.value}`);
              } else {
                  console.log(`${message.role} > [Non-text content]`);
              }
          }
        } else {
          console.log(run.status);
        }
}


async function main() {
  const thread = await openai.beta.threads.create();
  console.log(thread);
  await enquiry(thread, "it");
  await enquiry(thread, "Hello");
  await enquiry(thread, "Please talk me about you");
  await enquiry(thread, "what does he think about DevOps?");
  await enquiry(thread, "what's his favorite color?");

}

main();