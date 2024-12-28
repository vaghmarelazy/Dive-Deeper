import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY });

const models = [];

async function LoadModels() {
  try {
    const response = await groq.models.list();
    models.push(...response.data);
  } catch (error) {
    console.error("Failed to load models:", error);
  }
}
await LoadModels();

// for (const model of models) {
//   console.log(model.id)
// }

export async function POST(req) {
  try {
    // Parse the request body to get the transcript
    const { transcript } = await req.json();
    // console.log(transcript)
    // console.log("----------------------------------------------------------------------------------------")
    // Ensure models array is not empty before proceeding
    if (!models.length) {
      return NextResponse.json(
        { error: "No models available for processing." },
        { status: 500 }
      );
    }

    // Try models in sequence until one succeeds
    let error = null;
    for (const model of models) {
      try {
        const summarization = await groq.chat.completions.create({
          model: model.id || "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that summarizes text. provide the summary in English",
            },
            {
              role: "user",
              content: `Summarize the following Content:\n\n${transcript}`,
            },
          ],
          max_tokens: 1024,
          temperature: 0.5,
        });
        // console.log(summarization);
        // console.log("Current Model",model.id)

        return NextResponse.json({
          summary: summarization.choices[0].message.content,
          usedModel: model
        });
      } catch (modelError) {
        error = modelError;
        console.error(`Error with model ${model}:`, modelError);
        continue; // Try next model
      }
    }
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "Failed to generate transcript summary." },
      { status: 500 }
    );
  }
}
