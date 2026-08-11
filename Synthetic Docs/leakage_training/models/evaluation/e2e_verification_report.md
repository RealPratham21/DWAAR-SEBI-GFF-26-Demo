# Leakage Prediction E2E Verification

Date: 2026-06-13

Tenant used for verification:
- `6402b1bf-8100-4fa8-95f9-a1a9452b22fe`

Focus batch used to prove intent-only scoring:
- `LEAK_BATCH_017__6402b1bf`

## What was verified

### 1. Prediction is triggered on intent only

For `LEAK_BATCH_017__6402b1bf`, the system produced a leakage prediction before any settlement data existed.

Proof at intent-only stage:
- `batch_finality_status = PROCESSING`
- `payment_intents = 199`
- `dlq_items = 0`
- `settlement_observation_count = 0`
- `attachment_summary = null`
- `predicted_leakage_rate = 0.102566`
- `predicted_leakage_minor = 51353.05`
- `predicted_at = 2026-06-13T07:56:50Z`

Feature row also existed at that point in `ml_feature_store` with `label_json = null`, which confirms this was a pure pre-settlement inference.

### 2. Tenant leakage timeseries endpoint returns frontend-ready data

Request used:

```text
GET /v1/intelligence/timeseries/leakage-exposure?tenant_id=6402b1bf-8100-4fa8-95f9-a1a9452b22fe&granularity=day
```

Observed response:

```json
{
  "tenant_id": "6402b1bf-8100-4fa8-95f9-a1a9452b22fe",
  "data_available": true,
  "computed_at": "2026-06-13T07:57:16.659256785Z",
  "window_start": "2026-06-13T00:00:00Z",
  "window_end": "2026-06-13T00:00:00Z",
  "granularity": "day",
  "series": [
    {
      "date": "2026-06-13",
      "current_leakage_minor": 0,
      "predicted_leakage_minor": 19670.17
    }
  ]
}
```

This matches the response shape the frontend graph expects.

### 3. Real labeled rows were written back into the ML training tables

All five test batches (`LEAK_BATCH_013` through `LEAK_BATCH_017`) ended up with:
- a `LEAKAGE` feature row in `ml_feature_store`
- a non-null `label_json`
- a `LEAKAGE` label row in `ml_labels`

This confirms the train-on-real-data accumulation path is wired.

### 4. Leakage retraining loop ran

ML service log proof:

```text
2026-06-13 07:56:43,276 INFO app.models.leakage_prediction: leakage_model: retrain complete rows=383 real_rows=5
```

This confirms the background retraining path executed successfully once enough labeled rows were present.

## Important caveat

The technical flow works, but the live leakage truth for these batches came out as zero.

Observed post-settlement state for all five verification batches:
- `unmatched_amount_minor = 0.00`
- `under_settlement_amount_minor = 0.00`
- `reversal_exposure_minor = 0.00`
- `label_json.predicted_leakage_rate = 0`

That means:
- the intent-time prediction path is working
- the endpoint is working
- the label-writing and retrain loop are working
- but the current live settlement/attachment path is not reproducing the synthetic leakage manifests as actual leakage inside intelligence

So this test proves the pipeline is operational, but it also confirms the semantic mismatch we had discussed earlier: the system's live computed leakage is not matching the synthetic batch design.

## Manual frontend test files

For a fresh tenant, use these favorable future-dated files:

- `backend/generated/leakage_training/extracted/runtime_ingest/LEAK_BATCH_013__6402b1bf/intent.csv`
- `backend/generated/leakage_training/extracted/runtime_ingest/LEAK_BATCH_013__6402b1bf/settlement_replay.xlsx`
- `backend/generated/leakage_training/extracted/runtime_ingest/LEAK_BATCH_014__6402b1bf/intent.csv`
- `backend/generated/leakage_training/extracted/runtime_ingest/LEAK_BATCH_014__6402b1bf/settlement_replay.xlsx`
- `backend/generated/leakage_training/extracted/runtime_ingest/LEAK_BATCH_015__6402b1bf/intent.csv`
- `backend/generated/leakage_training/extracted/runtime_ingest/LEAK_BATCH_015__6402b1bf/settlement_replay.xlsx`
- `backend/generated/leakage_training/extracted/runtime_ingest/LEAK_BATCH_016__6402b1bf/intent.csv`
- `backend/generated/leakage_training/extracted/runtime_ingest/LEAK_BATCH_016__6402b1bf/settlement_replay.xlsx`
- `backend/generated/leakage_training/extracted/runtime_ingest/LEAK_BATCH_017__6402b1bf/intent.csv`
- `backend/generated/leakage_training/extracted/runtime_ingest/LEAK_BATCH_017__6402b1bf/settlement_replay.xlsx`

If you only want the smallest proof:
- ingest `LEAK_BATCH_017__6402b1bf/intent.csv`
- confirm prediction appears
- then ingest `LEAK_BATCH_017__6402b1bf/settlement_replay.xlsx`
- call the leakage timeseries API for that tenant

## Raw evidence

Structured JSON evidence for this run:
- `backend/generated/leakage_training/models/evaluation/e2e_verification_report.json`
