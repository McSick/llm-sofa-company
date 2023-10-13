const opentelemetry = require("@opentelemetry/api");
const OpenAI = require('openai');

  
export class OpenAIWrapper implements LLM {
    template: string;
    client: any;
    constructor(apiKey: string | undefined) {
        this.template = "";
        this.client = new OpenAI({
            apiKey: apiKey,
          });
    }
    setTemplate(template: string): void {
        this.template = template;
    }
    async generatePrompt(searchText: string): Promise<string> {
        let prompt = this.template.replace("{searchText}", searchText);
        const response = await this.client.chat.completions.create({
            messages: [{ role: 'user', content: prompt}],
            model: 'gpt-3.5-turbo',
        });
        let content = response.choices[0].message.content;

        //Add Telemetry Around the OpenAI Call
        let activeSpan = opentelemetry.trace.getActiveSpan();
        activeSpan.setAttribute("app.num_output_tokens", Math.ceil(content.length / 4));
        activeSpan.setAttribute("app.content", content);
        return content;
    }
}