import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: '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'
});

// export async function main() {
//   const chatCompletion = await getGroqChatCompletion();
//   // Print the completion returned by the LLM.
//   console.log(chatCompletion.choices[0]?.message?.content || "");
// }

export async function POST(req) {
    try {
      const { message } = await req.json();
  
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: message },
        ],
        model: "llama3-8b-8192",
        temperature: 0.5,
        max_tokens: 1024,
        top_p: 1,
        stop: null,
        stream: false,
      });
      return NextResponse.json({ response: chatCompletion.choices[0]?.message?.content });
    } catch (error) {
      console.error("Error generating AI response:", error);
      return NextResponse.json({ error: "Error generating AI response." }, { status: 500 });
    }
  }
