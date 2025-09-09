import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY!;
const GEMINI_SYSTEM_INSTRUCTION =
  process.env.GEMINI_SYSTEM_INSTRUCTION ??
  "You are a helpful assistant that filters YouTube search results based on user intent. Use the 'User search' and 'YouTube results' sections to identify relevant content. " +
    'Return ONLY a string of the result indexes separated by commas, nothing else.';
const GEMINI_USER_PROMPT_SUFFIX = process.env.GEMINI_USER_PROMPT_SUFFIX ?? '';
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite';
const genAI = new GoogleGenerativeAI(apiKey);

export async function filterYoutubeResultsWithGemini(
  searchTerm: string,
  aiUserPrompt: string,
  results: any[]
): Promise<any[]> {
  //let users determine free text for Gemini?
  const prompt = `
          User search: "${searchTerm}"
          YouTube results:
              ${results
                .map(
                  (item, idx) => `${idx}. Title: "${item.snippet.title}"
  Description: "${item.snippet.description}"
  Published At: "${item.snippet.publishedAt}"
  Channel Title: "${item.snippet.channelTitle}"`
                )
                .join('\n')}
            ${aiUserPrompt ? `User additional prompt: "${aiUserPrompt}"` : ''}
            .${GEMINI_USER_PROMPT_SUFFIX}
          `;

  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
    });
    const result = await model.generateContent(prompt);

    const textRaw =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ??
      result?.response?.text ??
      '';
    const text = typeof textRaw === 'function' ? textRaw() : textRaw;

    const relevantIndexes = text.split(',');
    return relevantIndexes;
  } catch (error) {
    throw error;
  }
}
