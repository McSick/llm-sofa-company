const opentelemetry = require("@opentelemetry/api");
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";


export class ClaudBedrockWrapper implements LLM {
    template: string;
    client: any;
    constructor(options: any) {
        this.template = "";
        this.client = new BedrockRuntimeClient(options);
    }
    setTemplate(template: string): void {
        this.template = template;
    }
    async generatePrompt(searchText: string): Promise<string> {
        let prompt = this.template.replace("{searchText}", searchText);
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
            modelId: 'anthropic.claude-instant-v1', /* required */
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
        let activeSpan = opentelemetry.trace.getActiveSpan();
        activeSpan.setAttribute("app.num_output_tokens", Math.ceil(content.length / 4));
        activeSpan.setAttribute("app.content", content);
        return content;
    }
}