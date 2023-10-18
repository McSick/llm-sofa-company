export interface LLM {
    template: String;
    model: string;
    client: any;
    generatePrompt(searchText: string): Promise<string>;
    setTemplate(template: String): void;
}
