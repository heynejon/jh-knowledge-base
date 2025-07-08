import requests
from newspaper import Article
from urllib.parse import urlparse
import re

def scrape_article_enhanced(url: str) -> dict:
    """
    Enhanced article scraper using newspaper3k for better content extraction.
    Falls back to custom scraper if needed.
    """
    try:
        # Method 1: Try newspaper3k (reliable and fast)
        try:
            article = Article(url)
            article.download()
            article.parse()
            
            if article.text and len(article.text) > 200:
                return {
                    "title": clean_title(article.title or "Unknown Title"),
                    "publication_name": extract_domain(url),
                    "full_text": clean_text_basic(article.text),
                    "method": "newspaper3k"
                }
        except Exception as e:
            print(f"Newspaper3k failed: {e}")
        
        # Method 2: Fall back to our custom scraper
        from scraper import scrape_article
        result = scrape_article(url)
        result["method"] = "custom_scraper"
        return result
        
    except Exception as e:
        raise Exception(f"All scraping methods failed: {str(e)}")

def extract_title_fallback(html_content, url: str) -> str:
    """Extract title from HTML content as fallback."""
    from bs4 import BeautifulSoup
    
    if isinstance(html_content, bytes):
        soup = BeautifulSoup(html_content, 'html.parser')
    else:
        soup = BeautifulSoup(html_content, 'html.parser')
    
    # Try multiple title extraction methods
    title_selectors = [
        'h1',
        'title',
        '[property="og:title"]',
        '[name="twitter:title"]',
        '.entry-title',
        '.post-title',
        '.article-title'
    ]
    
    for selector in title_selectors:
        element = soup.select_one(selector)
        if element:
            if selector in ['h1', 'title']:
                title = element.get_text(strip=True)
            else:
                title = element.get('content', '')
            if title and len(title) > 5:
                return title
    
    return "Unknown Title"

def extract_domain(url: str) -> str:
    """Extract clean domain name from URL."""
    try:
        domain = urlparse(url).netloc
        domain = domain.replace('www.', '')
        # Capitalize first letter for nicer display
        if '.' in domain:
            name = domain.split('.')[0]
            return name.capitalize()
        return domain
    except:
        return "Unknown Publication"

def clean_title(title: str) -> str:
    """Clean up article title by removing site names but preserving article content."""
    if not title:
        return "Unknown Title"
    
    # Only remove suffixes that look like site names (usually single words after | or -)
    # Keep hyphenated words that are part of the article title
    
    # Remove "| Site Name" patterns
    title = re.sub(r'\s*\|\s*[^|]*$', '', title)
    
    # Only remove "- Site Name" if it's likely a site name (short, single word, or known patterns)
    # Common site name patterns: "- NFX", "- TechCrunch", "- Medium", etc.
    if ' - ' in title:
        parts = title.rsplit(' - ', 1)
        if len(parts) == 2:
            main_title, suffix = parts
            # Only remove if suffix looks like a site name (short, no spaces, or known patterns)
            suffix_words = suffix.strip().split()
            if (len(suffix_words) == 1 and len(suffix) < 20) or \
               suffix.strip().lower() in ['nfx', 'techcrunch', 'medium', 'forbes', 'wired', 'ars technica']:
                title = main_title
    
    title = title.strip()
    return title if title else "Unknown Title"

def clean_text_basic(text: str) -> str:
    """Basic text cleaning without heavy processing."""
    if not text:
        return ""
    
    # Basic cleanup
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)  # Remove excessive line breaks
    text = re.sub(r'[ \t]+', ' ', text)  # Remove excessive spaces
    text = text.strip()
    
    return text