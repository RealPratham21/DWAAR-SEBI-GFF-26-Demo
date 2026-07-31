#!/bin/sh
set -eu

mc alias set local "${MINIO_ENDPOINT}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"
mc mb --ignore-existing "local/${MINIO_BUCKET}"
mc anonymous set none "local/${MINIO_BUCKET}"
if ! mc cors set "local/${MINIO_BUCKET}" /cors.xml; then
  echo "Warning: unable to apply bucket CORS via mc; configure manually if browser uploads fail."
fi
echo "MinIO bucket '${MINIO_BUCKET}' is ready."
