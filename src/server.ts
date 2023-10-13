const express = require('express');
const app = express();
const products = require('../products.json');
const opentelemetry = require("@opentelemetry/api");
import { UUID } from 'crypto';
import { ClaudBedrockWrapper } from './llm/ClaudeBedrock';
import { OpenAIWrapper } from './llm/OpenAI';
import { Product } from './types';
function getLLM(model: string | undefined) {
    switch (model) {
        case "OPEN_AI":
            return new OpenAIWrapper(process.env.OPENAI_API_KEY);
        case "CLAUDE_BEDROCK":
            return new ClaudBedrockWrapper({
                region: process.env.AWS_REGION,
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            })
        default:
            console.log("No LLM_MODEL set, defaulting to OpenAI");
            return new OpenAIWrapper(process.env.OPENAI_API_KEY);
    }
}

const llm = getLLM(process.env.LLM_MODEL || "");
llm.setTemplate(`Generate tags for the provided Description in CSV format. Examples:\n
example1: wooden,brown,hand-crafted\n
example2: plush,convertible,blue\n
example3: stunning,love seat,pink\n
The following is a list of valid tags and these tags in the below array must be used in the generated tags. \n
[wooden,brown,hand-crafted,rustic,metal,silver,modern,sleek,shiny,leather,black,luxurious,
sophisticated,fabric,beige,soft,cozy,wicker,natural,outdoor,tropical,rocker,gray,relax,wood,
velvet,emerald,luxury,plush,convertible,blue,versatile,office,ergonomic,recliner,comfort,bar,
stool,white,chic,sectional,red,spacious,vibrant,lounge,green,stylish,chesterfield,burgundy,classic,
vintage,armchair,yellow,bright,futon,navy,multifunctional,transformable,swivel,purple,stunning,
love seat,pink,romantic,dining,olive,elegant,daybed,teal,serene]\n

Description:"{searchText}"`)
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(express.json());


app.get('/', (req: Express.Request, res: any) => {
    res.render('index', { products });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


app.get('/', (req: Express.Request, res: any) => {
    res.render('index', { products });
});

// Extract all tags and store unique tags in a Set
const TAG_SET = new Set();

products.forEach((item: Product)=> {
    item.tags.forEach(tag => {
        TAG_SET.add(tag);
    });
});

app.post('/search', async (req:any, res:any) => {
    const searchDescription = req.body.search;

    let activeSpan = opentelemetry.trace.getActiveSpan();
    activeSpan.setAttribute("app.model", process.env.LLM_MODEL);
    activeSpan.setAttribute("app.search_text", searchDescription);

    // Generate tags for the search description
    const response = await llm.generatePrompt(searchDescription);

    // Extract tags from the response
    const tags = response.split(',').map(tag => tag.trim());

    // Add extra telemetry around returned tags
    let hallucinations = 0;
    tags.forEach(tag => {
        if (!TAG_SET.has(tag)) {
            hallucinations++;
        }
    });
    activeSpan.setAttribute("app.hallucinations", hallucinations);
    activeSpan.setAttribute("app.tags", tags);
    activeSpan.setAttribute("app.tags_count", tags.length);

    // Filter the product list based on tags
    const filteredProducts = products.filter((product: Product) =>
        product.tags.some(tag => tags.includes(tag))
    );
    activeSpan.setAttribute("app.filtred_count", filteredProducts.length);

    res.json(filteredProducts);
});
