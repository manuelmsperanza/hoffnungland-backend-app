import e from 'express';
import OpenAI from 'openai';
import { Pool } from 'pg';

export interface OpenAiMessage {
    role: string;
    content: string[];
    tokens : number;
}

export class OpenAiClient {

    private openai: OpenAI;

    constructor(openai : OpenAI) {
        this.openai = openai;
    }

    async initialiseThread(threadId : string, language: string, assistantId : string) : Promise<OpenAiMessage[]> {
        let messages : OpenAiMessage[] = [];
        let languages : string[] = [language];
        let message = await this.enquiry(threadId, languages, assistantId, true);

        messages.push(message);
        return messages;
    }

    async enquiry(threadId : string, userMessage: string[], assistantId : string, deleteUserMessage : boolean = false) : Promise<OpenAiMessage> {

        let returnMessage : OpenAiMessage = {
            role: "",
            content: [],
            tokens : 0
        };

        const message = await this.openai.beta.threads.messages.create(
            threadId,
            {
              role: "user",
              content: userMessage[0]
            }
        );
    
        let run = await this.openai.beta.threads.runs.createAndPoll(
            threadId,
            { 
            assistant_id: assistantId
            }
        );
        //console.log(run.thread_id + ' ' + run.usage?.total_tokens);
        returnMessage.tokens = run.usage?.total_tokens || 0;
        if (run.status === 'completed') {
            const messages = await this.openai.beta.threads.messages.list(
            run.thread_id,
            {run_id : run.id}
            );
            for (const message of messages.data.reverse()) {
                //console.log(message)
                if ('text' in message.content[0]) {
                    //console.log(`${message.role} > ${message.content[0].text.value}`);
                    returnMessage.role = message.role;

                    message.content[0].text.value.split('\n').forEach((paragraph : string) => {
                        if(paragraph.length > 0){
                            returnMessage.content.push(paragraph);    
                        }
                    });
                } else {
                    console.log(`${message.role} > [Non-text content]`);
                }
            }
        } else {
            console.log(run.status);
        }
        if(deleteUserMessage) {
            this.openai.beta.threads.messages.del(threadId, message.id);
        }
        return returnMessage;
    }

    async retrieveThread(threadId : string) : Promise<OpenAiMessage[]> {
        let messages : OpenAiMessage[] = [];
        const messagesList = await this.openai.beta.threads.messages.list(threadId);
        for (const message of messagesList.data.reverse()) {
            if ('text' in message.content[0]) {

                let returnMessage : OpenAiMessage = {
                    role: message.role,
                    content: [],
                    tokens : 0
                };

                message.content[0].text.value.split('\n').forEach((paragraph : string) => {
                    if(paragraph.length > 0){
                        returnMessage.content.push(paragraph);    
                    }
                });

                messages.push(returnMessage);
            }
        }
        return messages;
    }
}