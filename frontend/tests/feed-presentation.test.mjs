import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const frontendRoot = new URL('../', import.meta.url);

/** Transpile the dependency-free feed presentation module for Node tests. */
async function importFeedPresentation() {
  const source = await readFile(new URL('src/utils/feedPresentation.ts', frontendRoot), 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputText).toString('base64')}#${Math.random()}`
  );
}

test('builds feed copy for title and collection activities', async () => {
  const { activityCopy } = await importFeedPresentation();

  assert.deepEqual(activityCopy('TITLE_RATING_CHANGED', { rating: 8 }), {
    leading: 'rated',
    trailing: '8/10',
    target: 'title',
  });
  assert.deepEqual(activityCopy('COLLECTION_ITEM_ADDED', null), {
    leading: 'added',
    collectionConnector: 'to',
    target: 'titleAndCollection',
  });
});

test('formats recent activity with compact relative times', async () => {
  const { relativeActivityTime } = await importFeedPresentation();
  const now = Date.parse('2026-09-04T12:00:00.000Z');

  assert.equal(relativeActivityTime('2026-09-04T11:59:40.000Z', now), 'just now');
  assert.equal(relativeActivityTime('2026-09-04T11:45:00.000Z', now), '15m');
  assert.equal(relativeActivityTime('2026-09-04T09:00:00.000Z', now), '3h');
  assert.equal(relativeActivityTime('2026-09-02T12:00:00.000Z', now), '2d');
});
