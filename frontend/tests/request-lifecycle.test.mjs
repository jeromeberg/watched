import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const frontendRoot = new URL('../', import.meta.url);

/** Transpile one dependency-free TypeScript module for isolated Node tests. */
async function importSource(relativePath) {
  const source = await readFile(new URL(relativePath, frontendRoot), 'utf8');
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

/** Create a JWT-shaped value from one payload. */
function tokenOf(payload) {
  const header = Buffer.from('{}').toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
}

/** Create the local storage surface used by the API client. */
function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
}

beforeEach(() => {
  globalThis.localStorage = createStorage();
});

afterEach(() => {
  delete globalThis.fetch;
  delete globalThis.localStorage;
});

test('decodes base64url JWT payloads and validates their identity', async () => {
  const { decodeJwtPayload, userFromToken } = await importSource('src/context/authToken.ts');
  const token = tokenOf({ sub: 7, username: '࠾࠿', exp: 2_000_000_000 });

  assert.match(token.split('.')[1], /-/);
  assert.match(token.split('.')[1], /_/);
  assert.doesNotMatch(token.split('.')[1], /=/);

  assert.deepEqual(decodeJwtPayload(token), {
    sub: 7,
    username: '࠾࠿',
    exp: 2_000_000_000,
  });
  assert.deepEqual(userFromToken(token, 1_000_000_000_000), { id: 7, username: '࠾࠿' });
});

test('rejects malformed, incomplete, and expired JWTs', async () => {
  const { userFromToken } = await importSource('src/context/authToken.ts');

  assert.equal(userFromToken('not-a-token'), null);
  assert.equal(userFromToken(tokenOf({ username: 'alice' })), null);
  assert.equal(userFromToken(tokenOf({ sub: 1, username: '' })), null);
  assert.equal(userFromToken(tokenOf({ sub: 1, username: 'alice', exp: 'later' })), null);
  assert.equal(userFromToken(tokenOf({ sub: 1, username: 'alice', exp: 100 }), 101_000), null);
});

test('formats string and array API messages', async () => {
  const { formatApiErrorMessage } = await importSource('src/api/client.ts');

  assert.equal(formatApiErrorMessage({ message: 'Invalid credentials' }, 401), 'Invalid credentials');
  assert.equal(
    formatApiErrorMessage({ message: ['Username is required', 'Password is too short'] }, 400),
    'Username is required, Password is too short',
  );
});

test('invokes the unauthorized handler and still rejects a 401 request', async () => {
  const { ApiError, api, registerUnauthorizedHandler } = await importSource('src/api/client.ts');
  let unauthorizedCalls = 0;
  const unregister = registerUnauthorizedHandler(() => {
    unauthorizedCalls += 1;
  });
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: 'Session expired' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });

  await assert.rejects(api.get('/movies'), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 401);
    assert.equal(error.message, 'Session expired');
    return true;
  });
  assert.equal(unauthorizedCalls, 1);
  unregister();
});

test('returns null for an empty successful response', async () => {
  const { api } = await importSource('src/api/client.ts');
  globalThis.fetch = async () => new Response(null, { status: 200 });

  assert.equal(await api.get('/movies/999'), null);
});

test('ignores an aborted request and keeps the newer response state', async () => {
  const { api, isAbortError } = await importSource('src/api/client.ts');
  const requests = [];
  globalThis.fetch = (_url, options) =>
    new Promise((resolve, reject) => {
      const request = { resolve, reject };
      requests.push(request);
      options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    });

  const state = { results: [], error: '' };
  const firstController = new AbortController();
  const first = api
    .get('/movies/search?q=old', { signal: firstController.signal })
    .then((results) => {
      if (!firstController.signal.aborted) state.results = results;
    })
    .catch((error) => {
      if (!isAbortError(error)) state.error = error.message;
    });

  firstController.abort();
  const second = api.get('/movies/search?q=new').then((results) => {
    state.results = results;
  });
  requests[1].resolve(
    new Response(JSON.stringify([{ tmdbId: 2, title: 'New result' }]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

  await Promise.all([first, second]);
  assert.deepEqual(state.results, [{ tmdbId: 2, title: 'New result' }]);
  assert.equal(state.error, '');
});
