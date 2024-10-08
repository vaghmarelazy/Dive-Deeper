import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
});

let conversationHistory = [
  { role: "system", content: "You are a research assistant. You help to find out more about the history of the person or entity." }
];
  
export async function POST(req) {
  try {
    const { message, videoData } = await req.json();

    // Create a summarization prompt if videoData is present
    if (videoData) {
      const videoSummaryPrompt = `Summarize the following YouTube video:\n
      Title: ${videoData.snippet.title}\n
      Description: ${videoData.snippet.description}\n
      Published at: ${videoData.snippet.publishedAt}\n
      View count: ${videoData.statistics.viewCount}\n
      Like count: ${videoData.statistics.likeCount}\n
      Duration: ${videoData.contentDetails.duration}\n`;

      conversationHistory.push({ role: "user", content: videoSummaryPrompt });
    } else if (message) {
      conversationHistory.push({ role: "user", content: message });
    }

    // Generate AI response
    const chatCompletion = await groq.chat.completions.create({
      messages: conversationHistory,
      model: "llama-3.2-90b-text-preview",
      temperature: 0.5,
      max_tokens: 1024,
      top_p: 1,
      stop: null,
      stream: false,
    });

    // Format the AI's response (Handle any formatting like newlines)
    const aiMessage = chatCompletion.choices[0]?.message?.content;
    let formattedAiMessage = aiMessage ? aiMessage.replace(/\n/g, "<br />") : ""; // Convert newlines to <br />

    // Add regex to match words surrounded by double asterisks
    const boldRegex = /\*\*(\w+)\*\*/g;
    formattedAiMessage = formattedAiMessage.replace(boldRegex, '<strong>$1</strong>');

    conversationHistory.push({ role: "assistant", content: formattedAiMessage });

    return NextResponse.json({ response: formattedAiMessage });
  } catch (error) {
    console.error("Error generating AI response:", error);
    return NextResponse.json({ error: "Error generating AI response." }, { status: 500 });
  }
}
