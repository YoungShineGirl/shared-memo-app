const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'memos.json');

function ensureStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, '[]\n');
  }
}

function readMemos() {
  ensureStore();
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

function writeMemos(memos) {
  ensureStore();
  fs.writeFileSync(dataFile, `${JSON.stringify(memos, null, 2)}\n`);
}

function getAllMemos() {
  return readMemos().sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
}

function getMemo(id) {
  return readMemos().find((memo) => memo.id === Number(id)) || null;
}

function createMemo(content) {
  const memos = readMemos();
  const now = new Date().toISOString();
  const nextId = memos.reduce((maxId, memo) => Math.max(maxId, memo.id), 0) + 1;
  const memo = {
    id: nextId,
    content,
    created_at: now,
    updated_at: now
  };

  memos.push(memo);
  writeMemos(memos);
  return memo;
}

function updateMemo(id, content) {
  const memos = readMemos();
  const memo = memos.find((item) => item.id === Number(id));

  if (!memo) {
    return null;
  }

  memo.content = content;
  memo.updated_at = new Date().toISOString();
  writeMemos(memos);
  return memo;
}

function deleteMemo(id) {
  const memos = readMemos();
  const nextMemos = memos.filter((memo) => memo.id !== Number(id));

  if (nextMemos.length === memos.length) {
    return false;
  }

  writeMemos(nextMemos);
  return true;
}

module.exports = {
  getAllMemos,
  getMemo,
  createMemo,
  updateMemo,
  deleteMemo
};
