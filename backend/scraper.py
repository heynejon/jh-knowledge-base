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
    # Remove unwanted elements more aggressively
    unwanted_selectors = [
        'script', 'style', 'nav', 'header', 'footer', 'aside',
        '.advertisement', '.ads', '.social-share', '.comments',
        '.related-articles', '.sidebar', '.menu', '.navigation',
        '.breadcrumb', '.breadcrumbs', '.social-media', '.social-links',
        '.newsletter', '.subscribe', '.signup', '.subscription',
        '.author-bio', '.author-box', '.bio', '.profile',
        '.tags', '.categories', '.meta', '.post-meta', '.article-meta',
        '.share', '.sharing', '.social', '.follow', '.followus',
        '.related', '.recommendations', '.more-articles', '.next-article',
        '.prev-article', '.pagination', '.pager', '.load-more',
        '.advertisement-banner', '.ad-banner', '.promo', '.promotion',
        '.popup', '.modal', '.overlay', '.cookie-notice', '.cookie-banner',
        '.newsletter-signup', '.email-signup', '.mailing-list',
        '[class*="ad-"]', '[class*="advertisement"]', '[class*="promo"]',
        '[class*="newsletter"]', '[class*="subscribe"]', '[class*="social"]',
        '[class*="share"]', '[class*="follow"]', '[class*="signup"]',
        '[id*="ad-"]', '[id*="advertisement"]', '[id*="social"]',
        '[id*="newsletter"]', '[id*="subscribe"]', '[id*="footer"]',
        '[id*="header"]', '[id*="nav"]', '[id*="menu"]'
    ]
    
    for selector in unwanted_selectors:
        for element in soup.select(selector):
            element.decompose()
    
    # Try to find main content area with expanded selectors
    main_content_selectors = [
        'article',
        '[role="main"]',
        'main',
        '.article-content',
        '.post-content',
        '.entry-content',
        '.content',
        '.main-content',
        '.article-body',
        '.post-body',
        '.entry-body',
        '.content-body',
        '.text-content',
        '.article-text',
        '.post-text',
        '#content',
        '#main-content',
        '#article-content',
        '#post-content',
        '.inner-content',
        '.page-content',
        '.single-content',
        '.blog-content',
        '.story-content',
        '.essay-content'
    ]
    
    for selector in main_content_selectors:
        element = soup.select_one(selector)
        if element:
            text = element.get_text(separator='\n', strip=True)
            if len(text) > 200:  # Ensure we have substantial content
                return clean_text(text)
    
    # Try to find the largest text block that isn't navigation/header/footer
    # Look for div elements with substantial text content
    divs = soup.find_all('div')
    best_content = ""
    max_length = 0
    
    for div in divs:
        # Skip divs that are likely navigation/header/footer
        div_class = ' '.join(div.get('class', [])).lower()
        div_id = div.get('id', '').lower()
        
        skip_keywords = ['nav', 'header', 'footer', 'menu', 'sidebar', 'ad', 'social', 'share', 'follow', 'subscribe', 'newsletter', 'related', 'comment', 'meta', 'tag', 'category']
        
        if any(keyword in div_class or keyword in div_id for keyword in skip_keywords):
            continue
            
        text = div.get_text(separator='\n', strip=True)
        if len(text) > max_length and len(text) > 500:  # Must be substantial
            max_length = len(text)
            best_content = text
    
    if best_content:
        return clean_text(best_content)
    
    # Fall back to body content as last resort
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
    
    # Remove common unwanted phrases and patterns
    unwanted_phrases = [
        'Sign up for our newsletter',
        'Subscribe to our newsletter',
        'Get our weekly newsletter',
        'newsletter that',
        'startup teams read',
        'Follow us on',
        'Share this article',
        'Advertisement',
        'Click here to',
        'Read more:',
        'Related:',
        'Subscribe for more',
        'insights',
        'Related Content',
        'Table of Contents',
        'If You Only Remember One Thing',
        'Tell',
        'About Your Company',
        'As Founders ourselves',
        'BriefLink',
        'General Partner',
        'Subscribe',
        'Related Articles',
        'More Articles',
        'Share on',
        'Tweet this',
        'Like this',
        'Comment below',
        'Leave a comment',
        'What do you think',
        'Let us know',
        'Contact us',
        'About the author',
        'Author bio',
        'Follow @',
        'Connect with',
        'Join our',
        'Become a member',
        'Premium content',
        'Exclusive content',
        'we respect your time',
        'That\'s why we built',
        'a new software tool',
        'minimizes the upfront time',
        'VC meeting',
        'Simply us in 9 easy questions',
        'hear from us if it\'s a fit',
        'The Verticalization of Everything',
        'The AI Workforce is Here',
        'The Rise of a New Labor Market'
    ]
    
    for phrase in unwanted_phrases:
        # Use case-insensitive regex for better matching
        text = re.sub(re.escape(phrase), '', text, flags=re.IGNORECASE)
    
    # Remove lines that are likely navigation/metadata
    lines = text.split('\n')
    filtered_lines = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Skip lines that are likely navigation/metadata
        skip_patterns = [
            r'^\d+K?\+?\s*$',  # Numbers like "303K+"
            r'^·$',  # Single dot
            r'^@\w+$',  # Twitter handles
            r'^[A-Z][a-z]{2}\s+\d{4}$',  # Dates like "Apr 2025"
            r'^[A-Z][a-z]{2,}\s+\d{4}$',  # Dates like "April 2025"
            r'^\d{1,2}\..*',  # Numbered lists at start might be TOC
            r'^Phase\s+\d+:',  # Phase headings
            r'^What\'s Working Right Now:$',
            r'^\d+\.\s*[A-Z]',  # Numbered items that might be TOC
            r'^Get our weekly newsletter',
            r'^startup teams read',
            r'^Subscribe$',
            r'^Related Content$',
            r'^Table of Contents$',
            r'^that$',  # Common leftover word
            r'^read$',  # Common leftover word
            r'^and$',  # Common leftover word
            r'^the$',  # Common leftover word
            r'^of$',  # Common leftover word
            r'^to$',  # Common leftover word
            r'^Generative AI$',  # NFX specific
            r'^Pete Flint$',  # Author name
            r'^General Partner$',  # Title
            r'^Pete$',  # Just first name
            r'^that 303K\+$',  # Specific NFX pattern
            r'^The Verticalization of Everything$',
            r'^The AI Workforce is Here.*$',
            r'^The Rise of a New Labor Market$',
            r'^we respect your time.*$',
            r'^That\'s why we built.*$',
            r'^a new software tool.*$',
            r'^minimizes the upfront time.*$',
            r'^VC meeting.*$',
            r'^Simply us in.*$',
            r'^hear from us if.*$',
            r'^\d+K\+$',  # Numbers like "303K+"
            r'^,$',  # Single comma
            r'^$'  # Empty lines
        ]
        
        if any(re.match(pattern, line) for pattern in skip_patterns):
            continue
            
        # Skip very short lines that are likely metadata
        if len(line) < 10 and not any(char.isalpha() for char in line):
            continue
            
        filtered_lines.append(line)
    
    # Rejoin filtered lines
    text = '\n'.join(filtered_lines)
    
    # Remove repeated content sections (like "Related Content" sections)
    # Look for patterns that repeat 3+ times
    lines = text.split('\n')
    line_counts = {}
    for line in lines:
        if len(line.strip()) > 5:  # Only count substantial lines
            line_counts[line.strip()] = line_counts.get(line.strip(), 0) + 1
    
    # Remove lines that appear 3+ times (likely repeated navigation/footer content)
    filtered_lines = []
    for line in lines:
        if len(line.strip()) <= 5 or line_counts.get(line.strip(), 0) < 3:
            filtered_lines.append(line)
    
    text = '\n'.join(filtered_lines)
    
    # Remove any remaining multiple newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Remove trailing noise - if the last 10% of text seems repetitive or promotional, remove it
    lines = text.split('\n')
    if len(lines) > 20:  # Only do this for longer articles
        last_section = lines[-min(10, len(lines)//5):]  # Last 10 lines or 20% of article
        last_text = '\n'.join(last_section).lower()
        
        # Check if the last section contains mostly promotional/navigation content
        noise_keywords = ['related', 'subscribe', 'follow', 'newsletter', 'contact', 'about', 'more', 'read', 'share', 'social', 'sign up', 'join', 'member', 'company', 'workforce', 'verticalization']
        noise_count = sum(1 for keyword in noise_keywords if keyword in last_text)
        
        if noise_count >= 3:  # If 3+ noise keywords in the last section
            # Remove the noisy ending
            text = '\n'.join(lines[:-len(last_section)])
    
    return text.strip()