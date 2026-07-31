"""S3-compatible object storage abstraction."""

from functools import lru_cache

import boto3
from botocore.client import BaseClient
from botocore.config import Config
from botocore.exceptions import ClientError

from app.core.config import Settings, get_settings


class ObjectStorageError(Exception):
    pass


class ObjectStorageService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._internal_client = self._build_client(settings.s3_endpoint)
        self._public_client = self._build_client(settings.s3_public_endpoint)

    @staticmethod
    def _build_client(endpoint: str) -> BaseClient:
        settings = get_settings()
        return boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            region_name=settings.s3_region,
            use_ssl=settings.s3_secure,
            config=Config(signature_version="s3v4"),
        )

    @property
    def bucket(self) -> str:
        return self._settings.s3_bucket

    def generate_upload_url(
        self,
        *,
        storage_key: str,
        content_type: str,
        content_length: int,
    ) -> tuple[str, dict[str, str], int]:
        params = {
            "Bucket": self.bucket,
            "Key": storage_key,
            "ContentType": content_type,
            "ContentLength": content_length,
        }
        url = self._public_client.generate_presigned_url(
            ClientMethod="put_object",
            Params=params,
            ExpiresIn=self._settings.s3_presigned_expiry_seconds,
        )
        headers = {
            "Content-Type": content_type,
            "Content-Length": str(content_length),
        }
        return url, headers, self._settings.s3_presigned_expiry_seconds

    def generate_download_url(self, *, storage_key: str) -> tuple[str, int]:
        url = self._public_client.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": self.bucket, "Key": storage_key},
            ExpiresIn=self._settings.s3_presigned_expiry_seconds,
        )
        return url, self._settings.s3_presigned_expiry_seconds

    def object_exists(self, *, storage_key: str) -> bool:
        try:
            self._internal_client.head_object(Bucket=self.bucket, Key=storage_key)
            return True
        except ClientError as exc:
            error_code = exc.response.get("Error", {}).get("Code")
            if error_code in {"404", "NoSuchKey", "NotFound"}:
                return False
            raise ObjectStorageError("Unable to verify uploaded object.") from exc

    def get_object_metadata(self, *, storage_key: str) -> dict[str, int | str]:
        try:
            response = self._internal_client.head_object(Bucket=self.bucket, Key=storage_key)
        except ClientError as exc:
            error_code = exc.response.get("Error", {}).get("Code")
            if error_code in {"404", "NoSuchKey", "NotFound"}:
                raise ObjectStorageError("Uploaded object was not found in storage.") from exc
            raise ObjectStorageError("Unable to read uploaded object metadata.") from exc
        return {
            "content_length": int(response.get("ContentLength", 0)),
            "content_type": str(response.get("ContentType", "")),
        }

    def delete_object(self, *, storage_key: str) -> None:
        try:
            self._internal_client.delete_object(Bucket=self.bucket, Key=storage_key)
        except ClientError as exc:
            raise ObjectStorageError("Unable to delete uploaded object.") from exc


@lru_cache
def get_object_storage() -> ObjectStorageService:
    return ObjectStorageService(get_settings())
