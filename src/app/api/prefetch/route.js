import axios from "axios"
import { NextResponse } from "next/server"
import { YoutubeTranscript } from "youtube-transcript"

export async function POST(req) {
    const { videoId, videoData, model } = await req.json()
    console.log("Model in profexth", model.model)

    const apiUrl = process.env.NEXT_PUBLIC_BASE_URL

    if (!videoId) {
        return NextResponse.json({
            success: false,
            message: "Video ID not provided"
        }, { status: 400 })
    }
    if (!model) {
        return NextResponse.json({
            success: false,
            message: "Model not provided"
        }, { status: 400 })
    }
    if (!videoData) {
        return NextResponse.json({
            success: false,
            message: "Video data not provided"
        }, { status: 400 })
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId)
    if (!transcript) {
        return NextResponse.json({
            success: false,
            message: "Failed to fetch transcript"
        }, { status: 400 })
    }
    const transcriptText = transcript.map(text => text.text).join(', ')

    try {
        const response = await axios.post(`${apiUrl}/api/summarize`, {
            transcriptText:transcriptText,
            model : model,
            videoData:videoData
        })
        if(!response) {
            return NextResponse.json({
                success: false,
                message: "Failed to summarize transcript"
            }, { status: 500 })
        }
        console.log("Response from summarize",response.data)
        return NextResponse.json({
            success: true,
            transcriptText: response.data.summary
        }, { status: 200 })
    } catch (error) {
        console.error("Error summarizing content",error)    
        return NextResponse.json({
            success: false,
            message : "Error while summarize transcript"
        }, { status: 500 })
    }
}