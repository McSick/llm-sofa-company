const opentelemetry = require("@opentelemetry/api");
const OpenAI = require('openai');
import { LLM } from './LLM';

  
export class OpenAIWrapper implements LLM {
    template: string;
    client: any;
    model: string;
    constructor(apiKey: string | undefined) {
        this.template = "";
        this.model = "gpt-3.5-turbo";
        this.client = new OpenAI({
            apiKey: apiKey,
          });
    }
    setTemplate(template: string): void {
        this.template = template;
    }
    setModel(model: string): void {
        this.model = model;
    }
    async generatePrompt(searchText: string): Promise<string> {
        let activeSpan = opentelemetry.trace.getActiveSpan();
        let prompt = this.template.replace("{searchText}", searchText);
        activeSpan.setAttribute("app.model", this.model);
        activeSpan.setAttribute("app.llm", "OPEN_AI");
        const response = await this.client.chat.completions.create({
            messages: [{ role: 'user', content: prompt}],
            model: 'gpt-3.5-turbo',
        });
        let content = response.choices[0].message.content;

        //Add Telemetry Around the OpenAI Call

        activeSpan.setAttribute("app.num_output_tokens", Math.ceil(content.length / 4));
        activeSpan.setAttribute("app.content", content);
        return content;
    }
}