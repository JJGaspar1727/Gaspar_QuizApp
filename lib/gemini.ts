const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

export async function generateQuizFromNote(noteTitle: string, noteContent: string) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API Key is missing.');
  }

  const prompt = `
    Generate a quiz based on:
    Title: ${noteTitle}
    Content: ${noteContent}

    Return a JSON array of 5 questions with this structure:
    [
      {
        "question": "string",
        "type": "multiple_choice" | "identification",
        "options": ["string", "string", "string", "string"], 
        "answer": "string"
      }
    ]
    Return ONLY the JSON array, no markdown.
  `;

  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    if (!data.candidates) throw new Error(data.error?.message || "AI Generation failed");
    
    let text = data.candidates[0].content.parts[0].text;
    text = text.replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini Fetch Quiz Error:', error);
    throw error;
  }
}

export async function transcribeAudio(base64Audio: string, mimeType: string) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API Key is missing.');
  }

  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Transcribe this audio exactly into text. Return only the transcription." },
            { inline_data: { mime_type: mimeType, data: base64Audio } }
          ]
        }]
      })
    });

    const data = await response.json();
    if (!data.candidates) throw new Error(data.error?.message || "Transcription failed");
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini Fetch Transcription Error:', error);
    throw error;
  }
}
