import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
});

// Initial conversation history with a system message
let conversationHistory = [
  { role: "system", content: "You are a research assistant. You help to find out more about the history of the person or entity." }
];

// Store the current videoId to track when a new video is requested
let currentVideoId = null;

const summarizationUrl =
  process.env.NODE_ENV === "production"
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/getTranscript`
    : `http://localhost:3000/api/getTranscript`; // Replace with your production base URL

    const getAvailableModels = async () => {
      try {
        const modelsList = await groq.models.list();
        return modelsList
        // Filter only available models and store their IDs
        // return modelsList
        //   .filter(model => model.active == true)
        //   .then(console.log(modelsList))
        //   .map(model => model.id);
      } catch (error) {
        console.error("Error fetching models:", error);
        // Fallback to a default model if API call fails
        return ["llama-3.3-70b-versatile"];
      }
    };

    const availableModels = getAvailableModels();
    // console.log(availableModels);


export async function POST(req) {
  try {
    const { message, videoData, videoId } = await req.json();

    // Check if a new videoId is provided, if so, reset the conversation history
    if (videoId && videoId !== currentVideoId) {
      // Clear conversation history except the system message
      conversationHistory = [
        { role: "system", content: "You are a research assistant. You help to find out more about the history of the person or entity." }
      ];
      currentVideoId = videoId; // Update currentVideoId to the new videoId

      // Fetch the transcript for the new video
      let summaryData;
      try {
        const transcriptResponse = await fetch(summarizationUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ videoId }),
        });
        
        summaryData = await transcriptResponse.json();
      } catch (error) {
        console.error("Error generating Summary of the Video", error);
        return NextResponse.json({ error: "Error generating Summary of the Video" }, { status: 500 });
      }

      // Create a summarization prompt for the new video
      const videoSummaryPrompt = `Summarize the following YouTube video:\n
      Title: ${videoData.snippet.title}\n
      Description: ${videoData.snippet.description}\n
      Published at: ${videoData.snippet.publishedAt}\n
      View count: ${videoData.statistics.viewCount}\n
      Like count: ${videoData.statistics.likeCount}\n
      Duration: ${videoData.contentDetails.duration}\n
      ${summaryData ? `Summarize the transcript of the video: ${summaryData.summary} and how the host or the people in the video talked about the content of the video\n` : ''}
      List the names of the people or entities discussed in the video such as any person, place, or any other thing which can be further discussed.`;

      conversationHistory.push({ role: "user", content: videoSummaryPrompt });
    } else if (message) {
      // Add follow-up questions to the conversation history
      conversationHistory.push({ role: "user", content: message });

      // Ensure context is preserved by referring back to the video summary
      const previousSummary = conversationHistory.find(item => item.content.includes("Summarize the following YouTube video"));
      
      if (previousSummary) {
        const followUpPrompt = `Based on the previous summary of the video:\n ${previousSummary.content} \nUser asked: ${message}`;
        conversationHistory.push({ role: "user", content: followUpPrompt });
      }
    }

    // Generate AI response
    const chatCompletion = await groq.chat.completions.create({
      messages: conversationHistory,
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 1024,
      top_p: 1,
      stop: null,
      stream: false,
    });

    // Format the AI's response
    const aiMessage = chatCompletion.choices[0]?.message?.content;
    const formattedAiMessage = formatAiMessage(aiMessage);

    // Add the AI's response to the conversation history
    conversationHistory.push({ role: "assistant", content: formattedAiMessage });

    return NextResponse.json({ response: formattedAiMessage });
  } catch (error) {
    console.error("Error in POST request:", error);
    return NextResponse.json({ error: "An error occurred while processing the request." }, { status: 500 });
  }
}

// Helper function to format AI responses
function formatAiMessage(message) {
  if (!message) return "";

  // Convert newlines to <br />
  let formatted = message.replace(/\n/g, "<br />");

  // Replace words surrounded by double asterisks with <strong> tags
  formatted = formatted.replace(/\*\*(\w+)\*\*/g, '<strong>$1</strong>');

  return formatted;
}
