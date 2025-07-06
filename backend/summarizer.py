from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

def summarize_text(text: str, prompt: str) -> str:
    """
    Summarize the given text using OpenAI's GPT model with a custom prompt.
    """
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise Exception("OpenAI API key not found. Please set OPENAI_API_KEY in your .env file.")
        
        # Initialize OpenAI client
        client = OpenAI(api_key=api_key)
        
        # Combine the custom prompt with the article text
        full_prompt = f"{prompt}\n\nArticle text:\n{text[:4000]}"  # Limit text length
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Use cheaper, faster model
            messages=[
                {"role": "system", "content": "You are a helpful assistant that creates high-quality summaries of articles."},
                {"role": "user", "content": full_prompt}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
    
    except Exception as e:
        return f"Error generating summary: {str(e)}"