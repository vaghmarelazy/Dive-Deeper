import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import redisClient from "@/lib/redis";

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
});

const models = [];
let summaryData = null;

async function LoadModels() {
  if (models.length === 0) {
    try {
      const response = await groq.models.list();
      models.push(...response.data);
    } catch (error) {
      console.error("Failed to load models:", error);
    }
  }
}
await LoadModels();

// Store the current videoId to track when a new video is requested
let currentVideoId = null;
const summarizationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/getTranscript`;

export async function POST(req) {
  try {
    const { message, videoData, videoId } = await req.json();

    // Fetch the conversation history for the current videoId from Redis
    let conversationHistory = await redisClient.get(`conversation_history:${videoId}`);
    conversationHistory = conversationHistory ? JSON.parse(conversationHistory) : [
      { role: "system", content: "Help user" },
    ];

    // Check if a new videoId is provided, if so, reset the conversation history
    if (videoId && videoId !== currentVideoId) {
      // Clear conversation history from Redis for the previous video
      await redisClient.del(`conversation_history:${currentVideoId}`);
      currentVideoId = videoId; // Update currentVideoId to the new videoId

      // Start new conversation history and store it
      conversationHistory = [{ role: "system", content: "Help user" }];
      await redisClient.set(`conversation_history:${videoId}`, JSON.stringify(conversationHistory), { EX: 600 }); // Set TTL of 10 minutes

      // Fetch the transcript for the new video
      try {
        const transcriptResponse = await fetch(summarizationUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        Point out any link present on the video data and also list the important topics discussed in the video`;

      conversationHistory.push({ role: "user", content: videoSummaryPrompt });
      conversationHistory.push({ role: "assistant", content: summaryData.summary });
    } else if (message) {
      // Add follow-up messages to the conversation history
      conversationHistory.push({ role: "user", content: message });

      // Ensure context is preserved by referring back to the video summary
      const previousSummary = conversationHistory.find(item => item.content.includes("Summarize the following YouTube video"));
      
      if (previousSummary) {
        const followUpPrompt = `Based on the previous summary of the video:\n ${previousSummary.content} \nUser asked: ${message}`;
        conversationHistory.push({ role: "user", content: followUpPrompt });
      }
    }

    // Process with the model to get the AI response
    for (const model of models) {
      try {
        const chatCompletion = await groq.chat.completions.create({
          messages: conversationHistory,
          model: model.id,
          temperature: 0.5,
          max_tokens: 1024,
          top_p: 1,
          stop: null,
          stream: false,
        });

        const aiMessage = chatCompletion.choices[0]?.message?.content;

        // Add the AI response to the conversation history
        conversationHistory.push({ role: "assistant", content: aiMessage });

        // Store the updated conversation history in Redis with TTL of 10 minutes
        await redisClient.set(`conversation_history:${videoId}`, JSON.stringify(conversationHistory), { EX: 600 });
        console.log(conversationHistory)

        return NextResponse.json({ response: aiMessage });
      } catch (modelError) {
        console.error(`Error with model ${model.id}:`, modelError);
        continue; // Try next model
      }
    }
  } catch (error) {
    console.error("Error in POST request:", error);
    return NextResponse.json({ error: "An error occurred while processing the request." }, { status: 500 });
  }
}
