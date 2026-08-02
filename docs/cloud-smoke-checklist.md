# Cloud smoke-test checklist

Run after Railway API, worker, Bucket, Postgres, and Vercel frontend are configured.

1. Open the Vercel frontend.
2. Register a synthetic user.
3. Complete onboarding.
4. Save Company & Incorporation Information.
5. Upload a clean Certificate of Incorporation (COI).
6. Confirm the browser PUT targets the Railway Bucket (presigned URL host — not the API host for the file body).
7. Confirm finalisation returns promptly.
8. Confirm worker page processing in Railway worker logs (`Claimed processing run_id=…` / completion).
9. Confirm structured extraction / Cohere in worker logs (`Claimed structured-extraction run_id=…`).
10. Open Facts & Evidence.
11. Open highlighted evidence.
12. Upload current and historical GST registrations.
13. Resolve the historical GST issue.
14. Refresh the browser.
15. Logout and log back in.
16. Verify session refresh (access token renewal via HttpOnly cookie).
17. Verify notification deep links.
18. Check API and worker logs.
19. Confirm no storage keys, JWTs, cookies, Cohere keys, PAN/GSTIN/CIN, or full OCR/document text appear in logs.

## Notes

- API and worker deploys are independent — verify both after each change.
- If cross-site cookies fail, re-check `FRONTEND_ORIGINS`, `REFRESH_COOKIE_SECURE=true`, `REFRESH_COOKIE_SAMESITE=none`, and HTTPS on both hosts.
- If browser uploads fail, re-check Bucket CORS (exact Vercel origin) and `S3_PUBLIC_ENDPOINT` / `S3_ADDRESSING_STYLE`.
