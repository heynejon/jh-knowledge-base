// Temporary user ID for development (no auth yet)
// Replace with auth.uid() when authentication is added
export const DEV_USER_ID = process.env.DEV_USER_ID || '';

export const DEFAULT_SUMMARY_PROMPT = `You are a helpful assistant that summarizes articles. Create a clear, concise summary that captures the key points and main arguments. Use bullet points for the main takeaways. Keep the summary under 300 words.`;
