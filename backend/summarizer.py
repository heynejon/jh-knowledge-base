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

def clean_article_content(raw_text: str) -> str:
    """
    Clean the raw scraped article content using AI to remove navigation, ads, and irrelevant content.
    """
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise Exception("OpenAI API key not found. Please set OPENAI_API_KEY in your .env file.")
        
        # Initialize OpenAI client
        client = OpenAI(api_key=api_key)
        
        # Get cleaning prompt from settings
        from database import SettingsService
        cleaning_prompt = SettingsService.get_setting("cleaning_prompt")
        
        # Fall back to default if not set
        if not cleaning_prompt:
            cleaning_prompt = """You are a content extraction specialist. Your task is to clean scraped webpage content by removing all irrelevant elements while preserving the main article text EXACTLY as written.

CRITICAL INSTRUCTIONS:
1. NEVER change, rephrase, or modify even a single word of the actual article content
2. ONLY remove content that is clearly not part of the main article
3. Preserve all original formatting, line breaks, and paragraph structure
4. Do NOT add any new content or commentary

REMOVE these types of content:
- Navigation menus and breadcrumbs
- Website headers and footers
- Newsletter signup prompts
- Social media sharing buttons and links
- Author bios and "About the author" sections
- Related articles lists
- Advertisement content
- Comment sections
- "Subscribe" or "Follow us" calls-to-action
- Publication metadata (dates, categories, tags)
- Table of contents (if it's just navigation)
- Repeated promotional content
- Website navigation elements

KEEP these elements:
- The main article title
- All body paragraphs of the article
- Subheadings that are part of the article structure
- Quotes and citations within the article
- Lists that are part of the article content
- Any content that is clearly part of the author's intended message

Return ONLY the cleaned article content with no additional commentary or explanation."""

        # Handle longer content by using more tokens
        # GPT-4o-mini can handle up to 128k tokens, so let's be more generous
        text_to_clean = raw_text[:20000]  # Much larger input limit
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": cleaning_prompt},
                {"role": "user", "content": f"Clean this scraped content:\n\n{text_to_clean}"}
            ],
            max_tokens=16000,  # Much larger output limit to avoid cutting off articles
            temperature=0.1  # Low temperature for consistent cleaning
        )
        
        cleaned_content = response.choices[0].message.content.strip()
        
        # Basic validation - ensure we got substantial content back
        if len(cleaned_content) < 100:
            print("Warning: Cleaned content is very short, using original content")
            return raw_text
        
        # Check if the cleaned content seems complete compared to original
        # If it's significantly shorter than expected, it might have been cut off
        original_words = len(raw_text.split())
        cleaned_words = len(cleaned_content.split())
        
        # If cleaned content is less than 30% of original and original was substantial,
        # it might have been truncated due to token limits
        if original_words > 1000 and cleaned_words < (original_words * 0.3):
            print(f"Warning: Cleaned content seems truncated ({cleaned_words} vs {original_words} words)")
            print("This might be due to token limits. Consider the content cleaning successful but incomplete.")
        
        print(f"Content cleaning successful: {original_words} -> {cleaned_words} words")
        return cleaned_content
    
    except Exception as e:
        print(f"Error cleaning article content: {str(e)}")
        return raw_text  # Return original content if cleaning fails