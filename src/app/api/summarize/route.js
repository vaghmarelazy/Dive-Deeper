import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY });

export async function POST(req) {
  try {
    // Parse the request body to get the transcript
    const { transcript } = await req.json();
    // console.log("Transcript",transcript);

    // Call Groq to generate a summary of the transcript
    const summarization = await groq.chat.completions.create({
      model: "llama-3.2-90b-text-preview", // Adjust the model as per the API docs
      messages: [
        {
          role: "system", // This could be a system prompt if needed
          content: "You are a helpful assistant that summarizes text. provide the summary in English",
        },
        {
          role: "user",
          content: `Summarize the following Content:\n\n${transcript}`,
        },
      ],
      max_tokens: 1024, // Adjust the token limit as needed
      temperature: 0.5, // Adjust the creativity level as needed
    });
    // console.log("Summary",summarization.choices[0].message.content)

    // Return the summarization as a JSON response
    return NextResponse.json({ summary: summarization.choices[0].message.content });
  } catch (error) {
    console.error("Error generating summary:", error);

    // Return an error response if the summarization fails
    return NextResponse.json(
      { error: "Failed to generate transcript summary." },
      { status: 500 }
    );
  }
}
