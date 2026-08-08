/**
 * One-off export of Nivara demo payloads for backend bootstrap scripts.
 * Run: npx tsx scripts/export-nivara-payloads.ts
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { getNivaraWorkstreamSample, NIVARA_WORKSTREAM_KEYS } from '../lib/demo-data/nivara';

const outPath = resolve(__dirname, '../../backend/scripts/nivara_workstream_payloads.json');

const payloads: Record<string, unknown> = {};
for (const key of NIVARA_WORKSTREAM_KEYS) {
  payloads[key] = getNivaraWorkstreamSample(key);
}

writeFileSync(outPath, `${JSON.stringify(payloads, null, 2)}\n`, 'utf8');
console.log(`Wrote ${NIVARA_WORKSTREAM_KEYS.length} workstream payloads to ${outPath}`);
