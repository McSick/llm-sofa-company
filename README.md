# llm-sofa-company
# Description
This is a simple app to display a list of sofas and their details.
The app hooks into an LLM to take a description and output a list of tags to search for.
This currently can use either OpenAI or AWS Bedrock - Claud.  
See Environment Variables section on how to configure.

## Installation
### Install dependencies
```bash
npm install
```

## Environment Variables
This uses direnv to manage environment variables. You will need to create a .envrc file in the root of the project
See .envrc.example for an example of the required variables

### Run the app
```bash
npm start
```

## Usage
Navigate to (http://localhost:3000)[http://localhost:3000] to view the app.


Update the prompt to test around diffent prompts. See llm.setTemplate in server.ts.

## Observability
This app uses OpenTelemetry to send traces to Honeycomb.io by default.

