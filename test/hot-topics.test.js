import test from 'node:test';
import assert from 'node:assert/strict';

import { getEvaluationHash, restorePreviousEditorialEvaluations } from '../api/hot-topics.js';

function makeEvent(overrides = {}) {
  return {
    id: 'event-1',
    url: 'https://example.com/f1/story',
    ageMinutes: 10,
    sourceCount: 1,
    itemCount: 1,
    totalComments: 2,
    dimensions: { technicalDepth: 3, breakingValue: 4, audienceValue: 5, dramaIndex: 2, truthfulness: 8 },
    relatedItems: [{
      title: 'Audi targets F1 title bid by 2030',
      description: 'Audi has set a long-term target.',
      source: 'Example',
      tier: 'T1',
      publishedAt: '2026-07-13T00:00:00.000Z',
      score: 1,
      comments: 2,
      url: 'https://example.com/f1/story',
    }],
    ...overrides,
  };
}

test('evaluation hash ignores changing age and engagement data', () => {
  const original = makeEvent();
  const refreshed = makeEvent({
    ageMinutes: 15,
    totalComments: 50,
    relatedItems: [{ ...original.relatedItems[0], score: 20, comments: 50 }],
  });
  assert.equal(getEvaluationHash(original), getEvaluationHash(refreshed));
});

test('evaluation hash changes when editorial evidence changes', () => {
  const original = makeEvent();
  const changed = makeEvent({
    relatedItems: [{ ...original.relatedItems[0], title: 'Audi changes its F1 target' }],
  });
  assert.notEqual(getEvaluationHash(original), getEvaluationHash(changed));
});

test('previous Chinese evaluation is restored for the same report', () => {
  const current = makeEvent();
  const previous = makeEvent({
    titleCN: '奥迪目标在 2030 年争夺 F1 冠军',
    whatHappened: '奥迪公布了长期目标。',
    whyItMatters: '这明确了车队的发展时间表。',
    importance: 3,
    confidence: 4,
    informationType: 'reported',
    category: 'paddockVoice',
    confirmedFacts: [],
    unconfirmedClaims: [],
    tags: ['奥迪'],
  });
  const result = restorePreviousEditorialEvaluations([current], { topics: [previous] });
  assert.equal(result.restoredCount, 1);
  assert.equal(result.events[0].titleCN, previous.titleCN);
  assert.equal(result.events[0].whatHappened, previous.whatHappened);
});
