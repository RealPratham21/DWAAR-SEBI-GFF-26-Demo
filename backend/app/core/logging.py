import logging


def configure_logging(level: str, *, debug: bool = False) -> None:
    resolved = "DEBUG" if debug else level.upper()
    logging.basicConfig(
        level=resolved,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        force=True,
    )
    # Keep third-party HTTP/S3 noise down in production-like runs.
    if not debug:
        logging.getLogger("botocore").setLevel(logging.WARNING)
        logging.getLogger("boto3").setLevel(logging.WARNING)
        logging.getLogger("urllib3").setLevel(logging.WARNING)
        logging.getLogger("httpx").setLevel(logging.WARNING)
