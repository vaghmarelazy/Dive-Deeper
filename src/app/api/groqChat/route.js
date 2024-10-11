import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
});

let conversationHistory = [
  { role: "system", content: "You are a research assistant. You help to find out more about the history of the person or entity." }
];

const summarizationUrl =
      process.env.NODE_ENV === "production"
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/getTranscript`
        : `http://localhost:3000/api/getTranscript`; // Replace with your production base URL

    // console.log(summarizationUrl)


export async function POST(req) {
  try {
    const { message, videoData, videoId } = await req.json();

    let summaryData;
    if (videoId) {
      try {
        const transcriptResponse = await fetch(summarizationUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ videoId }),
        });
        
        summaryData = await transcriptResponse.json();
        // console.log("summaryData", summaryData.summary);
      } catch (error) {
        console.error("Error generating Summary of the Video", error);
        return NextResponse.json({ error: "Error generating Summary of the Video" }, { status: 500 });
      }
    }

    // Create a summarization prompt if videoData is present
    if (videoData) {
      const videoSummaryPrompt = `Summarize the following YouTube video:\n
      Title: ${videoData.snippet.title}\n
      Description: ${videoData.snippet.description}\n
      Published at: ${videoData.snippet.publishedAt}\n
      View count: ${videoData.statistics.viewCount}\n
      Like count: ${videoData.statistics.likeCount}\n
      Duration: ${videoData.contentDetails.duration}\n
      ${summaryData ? `Summarize the transcript of the video: ${summaryData.summary} and how the host or the people in the video talked about the content of the video\n` : ''}
      List the names of the people or entities discussed in the video such as any person, place, or any other thing which can be further discussed`;

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

    // Format the AI's response
    const aiMessage = chatCompletion.choices[0]?.message?.content;
    const formattedAiMessage = formatAiMessage(aiMessage);

    conversationHistory.push({ role: "assistant", content: formattedAiMessage });

    return NextResponse.json({ response: formattedAiMessage });
  } catch (error) {
    console.error("Error in POST request:", error);
    return NextResponse.json({ error: "An error occurred while processing the request." }, { status: 500 });
  }
}

function formatAiMessage(message) {
  if (!message) return "";

  // Convert newlines to <br />
  let formatted = message.replace(/\n/g, "<br />");

  // Replace words surrounded by double asterisks with <strong> tags
  formatted = formatted.replace(/\*\*(\w+)\*\*/g, '<strong>$1</strong>');

  return formatted;
}
