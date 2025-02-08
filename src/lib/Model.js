import Groq from "groq-sdk";

const key = process.env.NEXT_PUBLIC_GROQ_API_KEY

const groq = new Groq({
    apiKey: key,
    dangerouslyAllowBrowser: true
});

let model = "llama-3.3-70b-versatile"
async function ModelFetching() {
    try {
        const response = await groq.models.list()
        const models = response.data.filter((model)=>model.id?.includes("llama"));
        if(models.length > 0) {
            model = models[0].id
        }
    } catch (error) {
        console.error("Failed to list models",error)
    }
    return model;
}
// const Model = ModelFetching();
const Model = "llama-3.3-70b-versatile"
export default Model;