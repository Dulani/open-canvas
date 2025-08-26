import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: NextRequest) {
  try {
    const blob = await req.blob();
    const file = new File([blob], "audio.webm", { type: blob.type });

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: "distil-whisper-large-v3-en",
      language: "en",
      temperature: 0.0,
    });

    return NextResponse.json(
      { success: true, text: transcription.text },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to process feedback request:", error);

    return NextResponse.json(
      { error: "Failed to submit feedback." + error.message },
      { status: 500 }
    );
  }
}
