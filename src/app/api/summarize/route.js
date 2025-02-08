import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY });
export async function POST(req) {
  try {
    // Parse the request body to get the transcript
    const { transcriptText, model, videoData } = await req.json();
    console.log("Model in summarize", model.model)
    // Try models in sequence until one succeeds
    try {
      const summarization = await groq.chat.completions.create({
        model: model.model,
        if (messages.content) {
          
        }
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that summarizes text. provide the summary in English",
          },
          {
            role: "user",
            content: `Summarize the following YouTube video:\n
            Title: ${videoData.snippet.title}\n
            Description: ${videoData.snippet.description}\n
            Published at: ${videoData.snippet.publishedAt}\n
            View count: ${videoData.statistics.viewCount}\n
            Like count: ${videoData.statistics.likeCount}\n
            Duration: ${videoData.contentDetails.duration}\n
            Summarize the transcript of the video: ${transcriptText} and how the host or the people in the video talked about the content of the video\n
            Point out any link present on the video data and also list the important topics discussed in the video`,
          },
        ],
        max_tokens: 1024,
        temperature: 0.5,
      });
      console.log(summarization);
      // console.log("Current Model",model.id)
      if (!summarization) {
        return NextResponse.json({
          success: false,
          message: "No summarization found"
        })
      }
      return NextResponse.json({
        success: true,
        summary: summarization.choices[0].message.content,
      });
    } catch (err) {
      console.error("Error in summarizing the content", err);
      return NextResponse.json(
        { error: "Failed to summarize the transcript." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "Failed to generate transcript summary." },
      { status: 500 }
    );
  }
}

// Summarize the transcript of the video: ${transcriptText} and how the host or the people in the video talked about the content of the video\n
