import { YoutubeTranscript } from 'youtube-transcript';
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req) {
  const { videoId, model } = await req.json();
  // console.log("Model",model)
  // Fetch the transcript data using the YouTube Transcript API
  try {
    const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
    console.log("transcript page transcriptData - ", transcriptData)
    const transcriptText = transcriptData
      .map((item) => item.text) // Assuming each item has a `text` field
      .join(" "); // Join all text parts into a single string
  } catch (error) {
    console.error("Error fetching transcript", error)
    return NextResponse.json(
      { error: 'Failed to fetch transcript.' },
      { status: 500 }
    );
  }
  try {
    const response = await axios.post(`${window.origin}/api/summarize`, {
      transcript: transcriptText,
      model: model
    })
    const summarizationData = await response.json();
    console.log("The data from summarization :", summarizationData)
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
