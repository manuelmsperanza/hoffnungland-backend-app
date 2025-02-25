import OpenAI from 'openai';
import { env as opeAiEnv } from './openAi_config'; 

const openai = new OpenAI({
  apiKey: opeAiEnv.openAi_key,
  organization : opeAiEnv.openAi_Organization,
  project : opeAiEnv.openAi_DefaultProject
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
            assistant_id: opeAiEnv.openAi_ResumeAssistant
          }
        );
  
        if (run.status === 'completed') {
          const messages = await openai.beta.threads.messages.list(
            run.thread_id
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

  await enquiry(thread, "Hello");
  await enquiry(thread, "Pleaese talk me about you");
  await enquiry(thread, "what does he think about DevOps?");
  await enquiry(thread, "what's his favorite color?");

}

main();