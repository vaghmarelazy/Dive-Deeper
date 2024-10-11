import { YoutubeTranscript } from 'youtube-transcript';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { videoId } = await req.json();
    
    // Fetch the transcript data using the YouTube Transcript API
    const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);

    // Extract just the text from the transcript
    const transcriptText = transcriptData
      .map((item) => item.text) // Assuming each item has a `text` field
      .join(" "); // Join all text parts into a single string

    // Create an absolute URL for summarization (assumes localhost:3000 in development)
    const summarizationUrl =
    process.env.NODE_ENV === "production"
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/summarize`
      : `http://localhost:3000/api/summarize`; // Replace with your production base URL

  // console.log( "url",summarizationUrl)

    // Now that we have the clean transcript text, send it to the summarization model
    const summarizationResponse = await fetch(summarizationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript: transcriptText }), // Send clean text
    });

    const summarizationData = await summarizationResponse.json();

    // Return the summarized data to the frontend
    return NextResponse.json(summarizationData);

  } catch (error) {
    console.error('Error fetching transcript or summarizing:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve or summarize the video transcript.' },
      { status: 500 }
    );
  }
}
