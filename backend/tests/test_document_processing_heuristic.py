from app.modules.company_incorporation.document_processing.heuristic import assess_native_text


def test_empty_text_is_insufficient() -> None:
    result = assess_native_text("")
    assert result.is_sufficient is False
    assert result.reason == "empty"


def test_meaningful_certificate_text_is_sufficient() -> None:
    text = (
        "Certificate of Incorporation\n"
        "Nivara Techfab Private Limited\n"
        "CIN U29309MH2019PTC328517\n"
        "Incorporated on 2019-06-12 in Maharashtra under the Companies Act, 2013.\n"
        "Registrar of Companies, Pune"
    )
    result = assess_native_text(text)
    assert result.is_sufficient is True


def test_sparse_noise_is_insufficient() -> None:
    result = assess_native_text("§§§ $$$ !!!\x00\x01")
    assert result.is_sufficient is False


def test_large_image_with_sparse_text_is_insufficient() -> None:
    result = assess_native_text(
        "Scan page with a few more alphanumeric tokens here",
        image_count=1,
        image_coverage_ratio=0.9,
    )
    assert result.is_sufficient is False
    assert result.reason in {"large_image_dominant", "low_alphanumeric", "low_word_count"}
