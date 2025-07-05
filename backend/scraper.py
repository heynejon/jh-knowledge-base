import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import re

def scrape_article(url: str) -> dict:
    """
    Scrapes an article from a given URL and extracts title, publication name, and full text.
    """
    try:
        # Add headers to mimic a real browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract title
        title = extract_title(soup)
        
        # Extract publication name
        publication_name = extract_publication_name(soup, url)
        
        # Extract full text
        full_text = extract_full_text(soup)
        
        return {
            "title": title,
            "publication_name": publication_name,
            "full_text": full_text
        }
    
    except requests.RequestException as e:
        raise Exception(f"Failed to fetch article: {str(e)}")
    except Exception as e:
        raise Exception(f"Failed to parse article: {str(e)}")

def extract_title(soup: BeautifulSoup) -> str:
    """Extract the article title from various possible sources."""
    # Try different title selectors in order of preference
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
            title = element.get_text(strip=True) if selector in ['h1', 'title'] else element.get('content', '')
            if title:
                return title
    
    return "Unknown Title"

def extract_publication_name(soup: BeautifulSoup, url: str) -> str:
    """Extract the publication name from various possible sources."""
    # Try meta tags first
    meta_selectors = [
        '[property="og:site_name"]',
        '[name="application-name"]',
        '[name="twitter:site"]'
    ]
    
    for selector in meta_selectors:
        element = soup.select_one(selector)
        if element:
            pub_name = element.get('content', '').strip()
            if pub_name:
                return pub_name
    
    # Try common publication selectors
    pub_selectors = [
        '.site-title',
        '.logo',
        '.brand',
        '.publication-name',
        '.site-name'
    ]
    
    for selector in pub_selectors:
        element = soup.select_one(selector)
        if element:
            pub_name = element.get_text(strip=True)
            if pub_name:
                return pub_name
    
    # Fall back to domain name
    domain = urlparse(url).netloc
    return domain.replace('www.', '') if domain else "Unknown Publication"

def extract_full_text(soup: BeautifulSoup) -> str:
    """Extract the main article text content."""
    # Remove unwanted elements
    unwanted_selectors = [
        'script', 'style', 'nav', 'header', 'footer', 'aside',
        '.advertisement', '.ads', '.social-share', '.comments',
        '.related-articles', '.sidebar', '.menu'
    ]
    
    for selector in unwanted_selectors:
        for element in soup.select(selector):
            element.decompose()
    
    # Try to find main content area
    main_content_selectors = [
        'article',
        '.article-content',
        '.post-content',
        '.entry-content',
        '.content',
        'main',
        '.main-content',
        '#content'
    ]
    
    for selector in main_content_selectors:
        element = soup.select_one(selector)
        if element:
            text = element.get_text(separator='\n', strip=True)
            if len(text) > 100:  # Ensure we have substantial content
                return clean_text(text)
    
    # Fall back to body content
    body = soup.find('body')
    if body:
        text = body.get_text(separator='\n', strip=True)
        return clean_text(text)
    
    return "Could not extract article content"

def clean_text(text: str) -> str:
    """Clean and normalize extracted text."""
    # Remove excessive whitespace
    text = re.sub(r'\n\s*\n', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    
    # Remove common unwanted phrases
    unwanted_phrases = [
        'Sign up for our newsletter',
        'Subscribe to our newsletter',
        'Follow us on',
        'Share this article',
        'Advertisement',
        'Click here to',
        'Read more:',
        'Related:'
    ]
    
    for phrase in unwanted_phrases:
        text = text.replace(phrase, '')
    
    return text.strip()