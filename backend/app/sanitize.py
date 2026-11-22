"""
sanitize.py — Content sanitisation and upload safety helpers.

Two responsibilities:

  1. ``sanitize_html`` — strip dangerous markup (scripts, event handlers,
     javascript: URLs, embedded objects) from instructor-authored rich text
     before it is stored. This is the server-side half of the stored-XSS
     defence; the frontend sanitises again on render.

  2. File-content validation used by the upload endpoints. Extension checks
     alone are trivial to bypass (rename a .html file to .png), so we also
     verify magic bytes and reject active content (HTML/SVG/JS) where it has
     no business being uploaded.

The HTML sanitiser is dependency-free (no bleach/nh3) so it works with the
pinned requirements and on both SQLite and Postgres deployments.
"""
import html as _html
import re
from html.parser import HTMLParser

# ── HTML sanitisation ────────────────────────────────────────────────────────
_ALLOWED_TAGS = {
    'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del',
    'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'pre', 'code', 'span', 'div',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    'a', 'img', 'sub', 'sup',
}

# Tags whose entire content must be removed (not just the tag itself).
_DROP_CONTENT_TAGS = ('script', 'style', 'iframe', 'object', 'embed',
                      'form', 'noscript', 'svg', 'math', 'template')

_VOID_TAGS = {'br', 'hr', 'img'}

# Attributes allowed per tag. Anything not listed is stripped.
_ALLOWED_ATTRS = {
    'a':   {'href', 'title', 'target', 'rel'},
    'img': {'src', 'alt', 'title', 'width', 'height'},
    'td':  {'colspan', 'rowspan'},
    'th':  {'colspan', 'rowspan'},
}
_GLOBAL_ATTRS = {'class'}

# Schemes that must never appear in an href/src. `data:` is rejected wholesale
# (it can carry an HTML/SVG document that runs script when navigated to).
_BAD_SCHEME_RE = re.compile(r'^(?:javascript|vbscript|data|file):', re.IGNORECASE)
_WHITESPACE_OR_CTRL_RE = re.compile(r'[\x00-\x20\x7f]+')

_MAX_HTML_LEN = 500_000


def _safe_url(value):
    """True only when a URL is safe to keep in an href/src.

    Browsers strip tabs, newlines and NUL bytes before parsing a URL scheme, so
    ``java\\tscript:`` and ``&#106;avascript:`` both execute. We decode entities,
    remove every control/whitespace character, then check the resulting scheme —
    the same normalisation the browser performs.
    """
    if value is None:
        return False
    v = _html.unescape(str(value))
    v = _WHITESPACE_OR_CTRL_RE.sub('', v)
    if not v:
        return False
    return not _BAD_SCHEME_RE.match(v)


class _Sanitizer(HTMLParser):
    """Allowlist HTML sanitiser built on the stdlib parser.

    The previous regex implementation could be bypassed with tab/entity-encoded
    javascript: URLs and left some data: payloads intact. Parsing produces a
    tree, so text is re-escaped and unknown/dangerous markup cannot be
    reintroduced.
    """

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []
        self.stack = []
        self._drop_tag = None

    def _emit_start(self, tag, attrs):
        allowed = _ALLOWED_ATTRS.get(tag, set()) | _GLOBAL_ATTRS
        parts = []
        for name, value in attrs:
            lname = (name or '').lower()
            if lname.startswith('on') or lname not in allowed:
                continue
            if lname in ('href', 'src'):
                if not _safe_url(value):
                    continue
                parts.append(f'{lname}="{_html.escape(str(value).strip(), quote=True)}"')
            elif value is None:
                parts.append(lname)
            else:
                parts.append(f'{lname}="{_html.escape(str(value), quote=True)}"')
        attr_str = (' ' + ' '.join(parts)) if parts else ''
        self.out.append(f'<{tag}{attr_str}>')

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        if self._drop_tag:
            return
        if tag in _DROP_CONTENT_TAGS:
            self._drop_tag = tag
            return
        if tag not in _ALLOWED_TAGS:
            return
        self._emit_start(tag, attrs)
        if tag not in _VOID_TAGS:
            self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        tag = tag.lower()
        if self._drop_tag or tag in _DROP_CONTENT_TAGS or tag not in _ALLOWED_TAGS:
            return
        self._emit_start(tag, attrs)

    def handle_endtag(self, tag):
        tag = tag.lower()
        if self._drop_tag:
            if tag == self._drop_tag:
                self._drop_tag = None
            return
        if tag in _VOID_TAGS or tag not in _ALLOWED_TAGS:
            return
        if tag in self.stack:
            while self.stack:
                t = self.stack.pop()
                self.out.append(f'</{t}>')
                if t == tag:
                    break

    def handle_data(self, data):
        if self._drop_tag:
            return
        self.out.append(_html.escape(data, quote=False))

    def handle_comment(self, data):
        return

    def handle_decl(self, decl):
        return

    def handle_pi(self, data):
        return

    def close_unclosed(self):
        while self.stack:
            self.out.append(f'</{self.stack.pop()}>')


def sanitize_html(html):
    """
    Return a sanitised copy of ``html`` suitable for rendering to other users.
    Non-string input is coerced to str; None/empty returns ''. Fails closed:
    if parsing raises for any reason the raw markup is returned as escaped text.
    """
    if not html:
        return ''
    if not isinstance(html, str):
        html = str(html)
    if len(html) > _MAX_HTML_LEN:
        html = html[:_MAX_HTML_LEN]

    parser = _Sanitizer()
    try:
        parser.feed(html)
        parser.close()
    except Exception:
        return _html.escape(html, quote=False)
    parser.close_unclosed()
    return ''.join(parser.out)


def contains_html_or_script(data):
    """True when a byte payload looks like active web content (HTML/SVG/XML)."""
    if not data:
        return False
    head = data[:1024].lstrip().lower()
    return (head.startswith(b'<!doctype html') or head.startswith(b'<html') or
            head.startswith(b'<svg') or head.startswith(b'<?xml') or
            b'<script' in data[:4096].lower())


# ── File signature validation ────────────────────────────────────────────────
_MAGIC = {
    'png':  (b'\x89PNG\r\n\x1a\n',),
    'jpg':  (b'\xff\xd8\xff',),
    'jpeg': (b'\xff\xd8\xff',),
    'gif':  (b'GIF87a', b'GIF89a'),
    'webp': (b'RIFF',),          # RIFF....WEBP — checked further below
    'pdf':  (b'%PDF-',),
    'zip':  (b'PK\x03\x04', b'PK\x05\x06', b'PK\x07\x08'),
    'docx': (b'PK\x03\x04',),
    'xlsx': (b'PK\x03\x04',),
    'pptx': (b'PK\x03\x04',),
    'doc':  (b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1',),
    'xls':  (b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1',),
    'ppt':  (b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1',),
    'rar':  (b'Rar!\x1a\x07',),
    '7z':   (b'7z\xbc\xaf\x27\x1c',),
    'gz':   (b'\x1f\x8b',),
    'mp4':  (b'\x00\x00\x00',),  # ftyp box is at offset 4
    'mov':  (b'\x00\x00\x00',),
    'webm': (b'\x1a\x45\xdf\xa3',),
    'mkv':  (b'\x1a\x45\xdf\xa3',),
    'ogg':  (b'OggS',),
    'mp3':  (b'ID3', b'\xff\xfb', b'\xff\xf3', b'\xff\xf2'),
    'wav':  (b'RIFF',),
}


def matches_extension(data, ext):
    """
    Best-effort check that ``data`` actually looks like a ``.ext`` file.
    Returns True when the signature is unknown (e.g. txt/csv) so callers
    are never blocked on formats we cannot fingerprint.
    """
    if not data:
        return False
    ext = (ext or '').lower()
    sigs = _MAGIC.get(ext)
    if not sigs:
        return True
    if ext == 'webp':
        return data[:4] == b'RIFF' and data[8:12] == b'WEBP'
    if ext == 'mp4':
        return data[4:8] == b'ftyp'
    return any(data.startswith(sig) for sig in sigs)
