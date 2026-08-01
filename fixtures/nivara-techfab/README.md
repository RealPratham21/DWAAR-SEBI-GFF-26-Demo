# Nivara Techfab — Synthetic Company & Incorporation Fixture Pack

Self-contained fictional SME ground truth and deterministic document generator for Dwaar extraction testing. **Fixture generation only** — no application runtime changes.

## Fictional company summary

| Field | Value |
| --- | --- |
| Legal name | Nivara Techfab Private Limited |
| CIN | U29309MH2019PTC328517 |
| Incorporation | 2019-06-12, Pune, Maharashtra |
| PAN | AABCN1234Q |
| GSTIN | 27AABCN1234Q1Z9 |
| Udyam | UDYAM-MH-19-0048721 (registered 2020-09-18; address last updated 2023-09-05 after office change) |

## Registered offices

**Original (2019-06-12 → 2023-08-13)**  
Plot No. 9, Vertex Industrial Park, Chakan Industrial Area, Pune, Maharashtra 410501

**Current (from 2023-08-14)**  
Unit No. 14, Meridian Industrial Estate, MIDC Bhosari, Pune, Maharashtra 411026

## Why the office change exists

The company relocated from Chakan to MIDC Bhosari for operational expansion. Supporting records include a board resolution (2023-08-07), INC-22 filing and acknowledgement (SRN `R12345678`, filing date 2023-08-14), and current premises lease evidence.

## Core clean documents

| # | File | Requirement key |
| --- | --- | --- |
| 01 | `01-nivara-certificate-of-incorporation.pdf` | `original-certificate-of-incorporation` |
| 02 | `02-nivara-memorandum-of-association.pdf` | `current-certified-moa` |
| 03 | `03-nivara-articles-of-association.pdf` | `current-certified-aoa` |
| 04 | `04-nivara-board-resolution-office-change.pdf` | `board-resolution-office-change` |
| 05 | `05-nivara-inc22-registered-office.pdf` | `current-registered-office-filing` |
| 06 | `06-nivara-inc22-acknowledgement.pdf` | `filing-acknowledgement-or-srn` |
| 07 | `07-nivara-office-address-proof.pdf` | `registered-office-address-proof` |
| 08 | `08-nivara-pan-registration.pdf` | `pan-certificate` |
| 09 | `09-nivara-gst-registration-current.pdf` | `gst-registration-certificates` |
| 10 | `10-nivara-udyam-registration.pdf` | `udyam-registration-certificate` |

## Conflict variant

`generated/conflicts/11-nivara-gst-registration-old-address.pdf` — historically valid GST certificate showing the **original Chakan address** (registration date 2019-07-05). Expected future issue: conflicting/outdated registered-office address vs current Information tab (Bhosari). Resolution: keep current address; retain old certificate as historical evidence.

## OCR quality variants

| File | Source | Purpose |
| --- | --- | --- |
| `12-nivara-certificate-of-incorporation-scanned.pdf` | Clean COI | Image-only PDF (~185 DPI, skew, noise) — OCR required |
| `13-nivara-pan-mobile-photo.jpg` | Clean PAN PDF | Perspective/lighting JPEG — lower-confidence OCR |

Both use fixed seed `20260731`. No generative AI.

## Generation

### Docker (recommended)

From repository root:

```bash
docker compose --profile fixtures run --rm fixture-generator
```

### Local Python

Requires WeasyPrint system libraries (Pango, Cairo). On Debian/Ubuntu: `libcairo2 libpango-1.0-0 libgdk-pixbuf-2.0-0`.

**Windows:** WeasyPrint native libraries are usually unavailable. Use Docker, or install the Playwright fallback:

```bash
cd fixtures/nivara-techfab
pip install ".[local,dev]"
playwright install chromium
python scripts/generate_documents.py
python scripts/generate_quality_variants.py
```

**Linux/macOS with WeasyPrint libraries:**

```bash
cd fixtures/nivara-techfab
pip install ".[dev]"
python scripts/generate_documents.py
python scripts/generate_quality_variants.py
```

## Validation

```bash
cd fixtures/nivara-techfab
python scripts/validate_fixture.py
```

Or run the full Docker command above (includes validation).

## Tests

```bash
cd fixtures/nivara-techfab
pip install ".[dev]"
pytest
```

## Recommended live-demo upload order

1. Certificate of Incorporation  
2. MoA  
3. AoA  
4. Board resolution (office change)  
5. INC-22 filing  
6. Filing acknowledgement  
7. Office address proof  
8. PAN certificate  
9. Current GST certificate  
10. Udyam certificate  
11. **Old-address GST certificate** (controlled conflict)  

Use scanned COI and PAN mobile photo primarily for OCR stress testing, not the main jury demo.

## Architecture

```
ground-truth.json          ← canonical facts (single source of truth)
document-manifests/*.json  ← per-document overrides + expected extraction benchmark
templates/*.html           ← Jinja2 layouts (shared base + watermark)
scripts/                   ← generate, quality variants, validate
generated/                 ← reproducible outputs (clean / conflicts / quality-stress)
fixture-manifest.json      ← machine-readable benchmark with SHA-256 checksums
```

Every page includes: **SYNTHETIC DEMO DOCUMENT — NOT VALID FOR OFFICIAL USE**

## Expected future extraction results

- Clean PDFs: searchable native text, high-confidence facts on declared evidence pages  
- Old GST: address conflict with Information tab; no overwrite of current Bhosari address  
- Scanned COI / PAN photo: OCR required, medium confidence, no factual conflict  
