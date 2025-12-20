"""
Custom DRF renderers with proper Unicode support
"""

import json
from rest_framework.renderers import JSONRenderer


class UnicodeJSONRenderer(JSONRenderer):
    """
    JSON renderer that doesn't escape non-ASCII characters.
    This ensures Cyrillic and other Unicode text displays correctly.
    """
    charset = 'utf-8'
    ensure_ascii = False

    def render(self, data, accepted_media_type=None, renderer_context=None):
        """
        Render data to JSON with ensure_ascii=False
        """
        if data is None:
            return b''

        # Use json.dumps with ensure_ascii=False for proper Unicode
        ret = json.dumps(
            data,
            ensure_ascii=False,
            cls=self.encoder_class,
            allow_nan=not self.strict,
            indent=None,
            separators=(',', ':')
        )

        # Return as UTF-8 bytes
        return ret.encode('utf-8')
