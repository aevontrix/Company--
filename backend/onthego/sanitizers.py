"""
Input sanitization utilities for preventing XSS and injection attacks.
"""

import re
import html
from typing import Optional


def sanitize_html(text: str, allow_basic_formatting: bool = False) -> str:
    """
    Sanitize HTML content to prevent XSS attacks.

    Args:
        text: Input text to sanitize
        allow_basic_formatting: If True, allow basic tags like <b>, <i>, <u>

    Returns:
        Sanitized text
    """
    if not text:
        return text

    # First escape all HTML entities
    sanitized = html.escape(text)

    if allow_basic_formatting:
        # Re-enable basic formatting tags (escaped versions)
        safe_tags = {
            '&lt;b&gt;': '<b>',
            '&lt;/b&gt;': '</b>',
            '&lt;i&gt;': '<i>',
            '&lt;/i&gt;': '</i>',
            '&lt;u&gt;': '<u>',
            '&lt;/u&gt;': '</u>',
            '&lt;strong&gt;': '<strong>',
            '&lt;/strong&gt;': '</strong>',
            '&lt;em&gt;': '<em>',
            '&lt;/em&gt;': '</em>',
        }
        for escaped, original in safe_tags.items():
            sanitized = sanitized.replace(escaped, original)

    return sanitized


def sanitize_message(message: str, max_length: int = 5000) -> str:
    """
    Sanitize a chat message.

    Args:
        message: Chat message content
        max_length: Maximum allowed message length

    Returns:
        Sanitized message
    """
    if not message:
        return ""

    # Trim whitespace
    message = message.strip()

    # Truncate if too long
    if len(message) > max_length:
        message = message[:max_length]

    # Remove null bytes and control characters (except newlines and tabs)
    message = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', message)

    # Escape HTML to prevent XSS
    message = html.escape(message)

    return message


def sanitize_username(username: str) -> str:
    """
    Sanitize username for display.

    Args:
        username: Username to sanitize

    Returns:
        Sanitized username
    """
    if not username:
        return ""

    # Escape HTML
    username = html.escape(username)

    # Remove any remaining problematic characters
    username = re.sub(r'[<>"\']', '', username)

    return username[:100]  # Max 100 chars


def sanitize_search_query(query: str, max_length: int = 200) -> str:
    """
    Sanitize search query to prevent injection attacks.

    Args:
        query: Search query
        max_length: Maximum query length

    Returns:
        Sanitized query
    """
    if not query:
        return ""

    # Trim and truncate
    query = query.strip()[:max_length]

    # Remove SQL injection patterns
    sql_patterns = [
        r"(\s|^)(OR|AND|UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)(\s|$)",
        r"['\";]",
        r"--",
        r"/\*.*?\*/",
    ]

    for pattern in sql_patterns:
        query = re.sub(pattern, ' ', query, flags=re.IGNORECASE)

    # Escape special characters for LIKE queries
    query = query.replace('%', r'\%').replace('_', r'\_')

    return query.strip()


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal attacks.

    Args:
        filename: Original filename

    Returns:
        Safe filename
    """
    if not filename:
        return "unnamed"

    # Remove path separators
    filename = filename.replace('/', '').replace('\\', '')

    # Remove null bytes
    filename = filename.replace('\x00', '')

    # Remove leading dots (hidden files)
    while filename.startswith('.'):
        filename = filename[1:]

    # Only allow safe characters
    filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)

    # Limit length
    if len(filename) > 255:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        max_name = 255 - len(ext) - 1 if ext else 255
        filename = f"{name[:max_name]}.{ext}" if ext else name[:255]

    return filename or "unnamed"


def sanitize_url(url: str) -> Optional[str]:
    """
    Sanitize and validate URL.

    Args:
        url: URL to sanitize

    Returns:
        Sanitized URL or None if invalid
    """
    if not url:
        return None

    url = url.strip()

    # Only allow http(s) protocols
    if not url.startswith(('http://', 'https://')):
        return None

    # Block javascript: and data: URLs
    lower_url = url.lower()
    if 'javascript:' in lower_url or 'data:' in lower_url:
        return None

    # Escape HTML entities
    url = html.escape(url)

    return url
