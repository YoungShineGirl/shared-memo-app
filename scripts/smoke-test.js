const assert = require('assert');
const app = require('../server');

const PORT = '3100';
const BASE_URL = `http://127.0.0.1:${PORT}`;

const server = app.listen(PORT);

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}/api/memos`);
      if (response.ok) {
        return;
      }
    } catch (err) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  throw new Error('Server did not start in time');
}

async function request(path, options) {
  const response = await fetch(`${BASE_URL}${path}`, options);
  const body = await response.json();
  return { response, body };
}

async function run() {
  await waitForServer();

  const created = await request('/api/memos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'Smoke test memo' })
  });

  assert.strictEqual(created.response.status, 201);
  assert.ok(created.body.id);

  const listed = await request('/api/memos');
  assert.ok(listed.body.some((memo) => memo.id === created.body.id));

  const updated = await request(`/api/memos/${created.body.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'Smoke test memo updated' })
  });

  assert.strictEqual(updated.body.content, 'Smoke test memo updated');

  const deleted = await request(`/api/memos/${created.body.id}`, {
    method: 'DELETE'
  });

  assert.strictEqual(deleted.body.success, true);
}

run()
  .then(() => {
    server.close();
    console.log('Smoke test passed');
  })
  .catch((err) => {
    server.close();
    console.error(err);
    process.exit(1);
  });
