# Live Leakage Fix Verification

Date: 2026-06-13

## What was fixed

1. `zord-intelligence` now connects to the outcome DB directly.
2. The intent bridge now mirrors canonical intents into outcome `canonical_intents`.
3. The bridge poll interval was reduced from `15s` to `2s` so intent-side candidates appear fast enough for live settlement attachment.
4. `MATCH_UNRESOLVED` attachment events now try to recover the intended amount from intent-engine when the event payload carries `0`.
5. Leakage dashboard snapshots now fall back to batch-contract truth when `projection_state.leakage.total` is missing intended totals.
6. Attachment/variance batch attribution now resolves back to the runtime intent batch ID when `intent_id` is available, so predicted and current values can land on the same batch contract row.

## Files changed

- `backend/zord-intelligence/config/config.go`
- `backend/zord-intelligence/docker-compose.yml`
- `backend/zord-intelligence/cmd/main.go`
- `backend/zord-intelligence/internal/persistence/intent_bridge_repo.go`
- `backend/zord-intelligence/internal/persistence/outcome_intent_bridge_repo.go`
- `backend/zord-intelligence/internal/persistence/batch_contract_repo.go`
- `backend/zord-intelligence/internal/services/leakage_prediction_service.go`
- `backend/zord-intelligence/internal/services/leakage_intelligence_service.go`
- `backend/zord-intelligence/internal/services/projection_service.go`
- `backend/zord-intelligence/internal/worker/intent_batch_sync_worker.go`
- `backend/zord-intelligence/internal/services/ml_gradeA_integration_test.go`

## Verification evidence

### 1. Code-level verification

`go test ./...` in `backend/zord-intelligence` passed after the fixes.

### 2. Container startup verification

`zord-intelligence` startup log now shows:

- `connected auxiliary database intent_bridge`
- `connected auxiliary database outcome_bridge`
- `intent_batch_sync_worker: started (interval=2s lookback=48h0m0s)`

### 3. Outcome canonical intents were mirrored

For tenant `95401804-8b2c-4b18-87d3-350027abb498`, outcome DB now has:

- `canonical_intents = 199`

That tenant previously had `0` canonical intents, which is why all settlement rows were becoming unresolved.

### 4. Rerun attachment after mirroring

I reran attachment for settlement batch ref:

- `LEAK_BATCH_017-settlement`

Outcome log after the rerun:

- `decision_events=195`
- `ambiguous=46`
- `unresolved=0`
- `variance_events=149`
- `exact=149`

This is the key proof that outcome was no longer operating with an empty candidate set.

### 5. Leakage dashboard stopped showing a zero intended denominator

Before the fix, the dashboard leakage snapshot showed:

- `total_intended_amount_minor = 0`
- `total_observed_settled_amount_minor = 472013.75`

After the fix, the dashboard endpoint returned:

```json
{
  "tenant_id": "95401804-8b2c-4b18-87d3-350027abb498",
  "data_available": true,
  "snapshot_id": "snap_a6d51748-d699-47a4-8bd0-5a6f3ec31459",
  "window_start": "2026-06-13T00:00:00Z",
  "window_end": "2026-06-14T00:00:00Z",
  "computed_at": "2026-06-13T10:07:59.597842Z",
  "total_intended_amount_minor": 500683.75,
  "unmatched_amount_minor": 0,
  "under_settlement_amount_minor": 0,
  "orphan_amount_minor": 0,
  "reversal_exposure_minor": 0,
  "leakage_percentage": 0,
  "total_observed_settled_amount_minor": 472013.75,
  "ambiguous_value_at_risk_minor": 126022.04,
  "risk_adjusted_leakage_minor": 75613.224,
  "risk_tier": "CLEAN",
  "intelligence_mode": "GRADE_A",
  "duplicate_risk_count": 0,
  "duplicate_risk_exposure_minor": 0,
  "confirmed_duplicate_count": 0,
  "confirmed_duplicate_exposure_minor": 0
}
```

So the most visibly erratic part is fixed: the system no longer says “settled money exists but intended money is zero”.

## Important remaining caveat

The specific `LEAK_BATCH_017` replay used here is still not producing non-zero live leakage inside outcome/intelligence after attachment succeeds.

What the rerun produced:

- attachment now works
- unresolved is now `0` instead of `195`
- variances are emitted
- but the emitted variance amounts are `0`
- so intelligence correctly stores current leakage as `0` for this run

In other words:

- the plumbing bug is fixed
- the candidate-set bug is fixed
- the zero-denominator dashboard bug is fixed
- but this particular settlement replay is still not surfacing monetary leakage in the upstream outcome semantics

So if you test this same file pair again, you should expect:

- prediction to appear
- the API to return stable intended totals
- settlement to attach sensibly
- but current leakage may still be `0` if outcome keeps emitting zero-value variance records for that file pair

## Recommended manual test flow now

1. Create a fresh tenant.
2. Upload the intent file.
3. Wait `3-5 seconds` so the `2s` bridge has time to mirror canonical intents into outcome.
4. Upload the settlement file.
5. Query:
   - `GET /v1/intelligence/timeseries/leakage-exposure?tenant_id=<tenant>&granularity=day`
   - `GET /v1/intelligence/dashboard/leakage?tenant_id=<tenant>&limit=10`

## Bottom line

The live flow is materially healthier now:

- prediction path works
- outcome gets canonical intent candidates
- attachment no longer collapses into all-unresolved for this case
- dashboard denominator is fixed

The remaining mismatch is now mostly about the upstream attachment/variance semantics of the replayed settlement file, not the bridge/prediction plumbing inside `zord-intelligence`.
