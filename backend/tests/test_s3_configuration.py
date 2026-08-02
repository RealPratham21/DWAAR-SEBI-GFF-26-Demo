"""Storage client configuration for path/virtual addressing and dual endpoints."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from app.core.config import Settings
from app.storage.s3 import ObjectStorageService, _s3_config


def test_path_style_config() -> None:
    settings = Settings(S3_ADDRESSING_STYLE="path")
    config = _s3_config(settings)
    assert config.s3["addressing_style"] == "path"


def test_virtual_style_config() -> None:
    settings = Settings(S3_ADDRESSING_STYLE="virtual")
    config = _s3_config(settings)
    assert config.s3["addressing_style"] == "virtual"


def test_auto_style_leaves_addressing_to_botocore() -> None:
    settings = Settings(S3_ADDRESSING_STYLE="auto")
    config = _s3_config(settings)
    assert getattr(config, "s3", None) in (None, {})


@patch("app.storage.s3.boto3.client")
def test_dual_endpoints_and_https(mock_client: MagicMock) -> None:
    mock_client.return_value = MagicMock()
    settings = Settings(
        S3_ENDPOINT="https://internal.storage.railway.app",
        S3_PUBLIC_ENDPOINT="https://public.storage.railway.app",
        S3_SECURE=True,
        S3_ADDRESSING_STYLE="virtual",
        S3_REGION="us-east-1",
        S3_ACCESS_KEY="ak",
        S3_SECRET_KEY="sk",
        S3_BUCKET="dwaar-documents",
        S3_PRESIGNED_EXPIRY_SECONDS=600,
    )
    storage = ObjectStorageService(settings)
    assert mock_client.call_count == 2
    endpoints = {call.kwargs["endpoint_url"] for call in mock_client.call_args_list}
    assert endpoints == {
        "https://internal.storage.railway.app",
        "https://public.storage.railway.app",
    }
    for call in mock_client.call_args_list:
        assert call.kwargs["use_ssl"] is True
        assert call.kwargs["config"].signature_version == "s3v4"

    public = MagicMock()
    public.generate_presigned_url.return_value = "https://public.example/put"
    storage._public_client = public
    storage._internal_client = MagicMock()

    url, headers, expiry = storage.generate_upload_url(
        storage_key="obj/1",
        content_type="application/pdf",
        content_length=12,
    )
    assert url.startswith("https://")
    assert headers["Content-Type"] == "application/pdf"
    assert expiry == 600
    public.generate_presigned_url.assert_called()
    assert public.generate_presigned_url.call_args.kwargs["ClientMethod"] == "put_object"

    public.generate_presigned_url.return_value = "https://public.example/get"
    download_url, download_expiry = storage.generate_download_url(storage_key="obj/1")
    assert download_url.startswith("https://")
    assert download_expiry == 600
    assert public.generate_presigned_url.call_args.kwargs["ClientMethod"] == "get_object"

    storage._internal_client.head_object.return_value = {
        "ContentLength": 12,
        "ContentType": "application/pdf",
    }
    meta = storage.get_object_metadata(storage_key="obj/1")
    assert meta["content_length"] == 12
    storage._internal_client.head_object.assert_called()
