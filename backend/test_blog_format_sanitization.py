from app.sanitize import sanitize_html


def test_blog_editor_formatting_styles_survive_server_sanitization():
    source = (
        '<p style="font-family: Georgia; font-size: 24px; color: #123456; '
        'background-color: #fff1a8; line-height: 1.75; text-align: justify; '
        'margin-left: 40px">Formatted article text</p>'
    )

    result = sanitize_html(source)

    assert 'font-family: &#x27;Georgia&#x27;' in result or "font-family: 'Georgia'" in result
    assert 'font-size: 24px' in result
    assert 'color: #123456' in result
    assert 'background-color: #fff1a8' in result
    assert 'line-height: 1.75' in result
    assert 'text-align: justify' in result
    assert 'margin-left: 40px' in result
    assert 'Formatted article text' in result


def test_blog_editor_style_sanitizer_rejects_unsafe_css_and_markup():
    source = (
        '<p style="position: fixed; background-image: url(javascript:alert(1)); '
        'color: #123456" onclick="alert(1)">Safe text</p>'
        '<script>alert(2)</script>'
    )

    result = sanitize_html(source)

    assert 'color: #123456' in result
    assert 'position' not in result
    assert 'background-image' not in result
    assert 'onclick' not in result
    assert '<script' not in result
    assert 'Safe text' in result
