export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, noteStyle = 'bullet', detailLevel = 'concise', tone = 'simple' } = req.body;
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'No text provided' });
  }

  const styleInstructions = {
    bullet: "Format as clear bullet points grouped under short headers.",
    paragraph: "Write as flowing, well-structured paragraphs, not bullet fragments.",
    flashcard: "Format as a list of question-and-answer pairs, like flashcards, testing recall of key concepts.",
    cornell: "Use Cornell note style: short 'cue' keywords/questions on the left concept, paired with a fuller explanation for each."
  };

  const detailInstructions = {
    concise: "Keep it tight — only the essential points, no filler.",
    detailed: "Go deep — include context, examples, and connections between ideas, not just facts.",
    eli5: "Explain it as if teaching someone encountering this topic for the very first time — define terms, use simple analogies."
  };

  const toneInstructions = {
    simple: "Use plain, everyday language, avoiding unnecessary jargon.",
    exam: "Use precise, technical, exam-appropriate terminology, as if preparing the student for a formal test."
  };

  const systemPrompt = `You are a study assistant that transforms source material into genuinely new, actively synthesized study notes — you do NOT copy sentences from the source or simply reorder/shorten them. You must reprocess the ideas: explain concepts in fresh wording, identify the underlying structure and relationships between ideas, and present them in a way a textbook wouldn't. Directly copied or lightly-reworded sentences are a failure condition.

Style: ${styleInstructions[noteStyle]}
Detail level: ${detailInstructions[detailLevel]}
Tone: ${toneInstructions[tone]}

Respond ONLY with valid JSON, no markdown code fences, no extra text. Shape: {"notes": "string containing the formatted notes described above", "quiz": [{"question": "string", "options": ["A","B","C","D"], "correctIndex": 0}]}. Generate exactly 5 quiz questions based on the provided text, testing understanding of concepts, not just fact recall.`;

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: text.slice(0, 15000) }] }]
        })
      }
    );

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());

    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate. Try again.' });
  }
}