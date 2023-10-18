const opentelemetry = require("@opentelemetry/api");
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { LLM } from './LLM';

export class ClaudBedrockWrapper implements LLM {
    template: string;
    client: any;
    model: string;
    constructor(options: any) {
        this.template = "";
        this.model = "anthropic.claude-instant-v1";
        this.client = new BedrockRuntimeClient(options);
    }
    setTemplate(template: string): void {
        this.template = template;
    }
    setModel(model: string): void {
        this.model = model;
    }   
    async generatePrompt(searchText: string): Promise<string> {
        let prompt = this.template.replace("{searchText}", searchText);
        let activeSpan = opentelemetry.trace.getActiveSpan();
        activeSpan.setAttribute("app.model", this.model);
        activeSpan.setAttribute("app.llm", "CLAUDE_BEDROCK");
        // Claude wants Human in the prompt
        const params = {
            body: JSON.stringify({
                prompt: "\n\nHuman: " + prompt + "\n\nAssistant:",
                max_tokens_to_sample: 300,
                temperature: 0.5,
                top_k: 250,
                top_p: 1,
                stop_sequences: ["\n\nHuman:"],
                anthropic_version: "bedrock-2023-05-31"
            }),
            modelId: this.model, /* required */
            accept: '*/*',
            contentType: 'application/json'
        };

        // Call Bedrock
        const command = new InvokeModelCommand(params);
        const response = await this.client.send(command);
        // Decode the response
        const asciiDecoder = new TextDecoder('ascii');
        const data = JSON.parse(asciiDecoder.decode(response.body));
        let content = data.completion.trim();

        //Add Telemetry Around the OpenAI Call
        activeSpan.setAttribute("app.num_output_tokens", Math.ceil(content.length / 4));
        activeSpan.setAttribute("app.content", content);
        return content;
    }
}