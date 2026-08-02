#!/usr/bin/env python3
"""One-off Railway Bucket / S3 configuration verification.

Validates credentials, confirms the bucket exists, uploads a uniquely named
test object, reads metadata, generates a presigned download URL, then deletes
the object.

Never creates a bucket, never makes a bucket public, never prints credentials.
Does not run automatically on API/worker startup.
"""

from __future__ import annotations

import sys
import uuid
from datetime import UTC, datetime

from app.core.config import get_settings
from app.storage.s3 import ObjectStorageError, ObjectStorageService
from botocore.exceptions import ClientError


def main() -> int:
    settings = get_settings()
    storage = ObjectStorageService(settings)
    key = f"_dwaar_verify/{datetime.now(tz=UTC).strftime('%Y%m%dT%H%M%SZ')}-{uuid.uuid4().hex}.txt"
    body = b"dwaar-s3-configuration-verify\n"

    print("S3 configuration verification")
    print(f"  bucket={settings.s3_bucket}")
    print(f"  region={settings.s3_region}")
    print(f"  addressing_style={settings.s3_addressing_style}")
    print(
        f"  endpoint_scheme={'https' if settings.s3_endpoint.lower().startswith('https') else 'http'}"
    )
    print(
        f"  public_endpoint_scheme={'https' if settings.s3_public_endpoint.lower().startswith('https') else 'http'}"
    )
    print(f"  test_key={key}")

    try:
        # Head bucket without printing endpoint hostnames that embed credentials.
        storage._internal_client.head_bucket(Bucket=storage.bucket)
        print("  bucket_exists=ok")

        storage.put_object_bytes(
            storage_key=key,
            body=body,
            content_type="text/plain",
        )
        print("  upload=ok")

        metadata = storage.get_object_metadata(storage_key=key)
        print(f"  metadata_content_length={metadata['content_length']}")
        print(f"  metadata_content_type={metadata['content_type']}")

        download_url, expires = storage.generate_download_url(storage_key=key)
        if not download_url.startswith(("http://", "https://")):
            print("  presign=failed (unexpected URL scheme)", file=sys.stderr)
            return 1
        # Confirm URL is non-empty and time-limited without printing the signed URL
        # (it embeds temporary auth query params).
        print(f"  download_presign=ok expires_in={expires}s")

        storage.delete_object(storage_key=key)
        print("  cleanup=ok")
    except (ClientError, ObjectStorageError) as exc:
        print(f"  error={type(exc).__name__}: verification failed", file=sys.stderr)
        return 1

    print("S3 configuration verification succeeded.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
