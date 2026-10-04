import assert from 'node:assert/strict';
import { createAssetDraft } from '../data/asset-options';
import {
  ASSET_HISTORY_LIMIT,
  parseAssetHistory,
  recordAssetHistory,
} from '../lib/asset-history';

const original = createAssetDraft();
const edited = { ...original, notes: 'First edit' };
const entries = recordAssetHistory(
  [],
  original,
  edited,
  'edit:notes',
  1000,
  'one',
);
assert.deepEqual(entries[0].draft, original);
assert.equal(
  recordAssetHistory(entries, edited, edited, 'edit:notes'),
  entries,
);
assert.equal(
  recordAssetHistory(
    entries,
    edited,
    { ...edited, notes: 'More typing' },
    'edit:notes',
    1400,
    'two',
  ),
  entries,
);
const later = recordAssetHistory(
  entries,
  edited,
  { ...edited, notes: 'Later edit' },
  'edit:notes',
  2500,
  'three',
);
assert.equal(later.length, 2);
assert.equal(later[0].draft.notes, 'First edit');
assert.equal(
  recordAssetHistory(entries, edited, original, 'random', 1500, 'four').length,
  2,
);
const loaded = parseAssetHistory(JSON.stringify(later));
assert.deepEqual(loaded, later);
loaded[0].draft.notes = 'Changed after loading';
assert.equal(later[0].draft.notes, 'First edit');
let many = entries;
for (let index = 0; index < 60; index++)
  many = recordAssetHistory(
    many,
    original,
    edited,
    'random',
    3000 + index,
    `item-${index}`,
  );
assert.equal(many.length, ASSET_HISTORY_LIMIT);
assert.equal(many[0].id, 'item-59');
assert.throws(() =>
  parseAssetHistory(
    JSON.stringify([{ ...entries[0], draft: { category: 'character' } }]),
  ),
);
assert.throws(() =>
  parseAssetHistory(JSON.stringify([{ ...entries[0], createdAt: 9e15 }])),
);
assert.throws(() => parseAssetHistory('{broken'));
console.log(
  'Asset history checks passed: snapshots, typing groups, restoration, limits and invalid data.',
);
