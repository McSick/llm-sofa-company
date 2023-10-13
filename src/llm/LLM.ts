interface LLM {
    template: String;
    client: any;
    generatePrompt(searchText: string): Promise<string>;
    setTemplate(template: String): void;
}
