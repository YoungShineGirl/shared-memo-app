const memoList = document.querySelector('#memoList');
const modal = document.querySelector('#modal');
const confirmModal = document.querySelector('#confirmModal');

const modalTitle = document.querySelector('#modalTitle');
const memoInput = document.querySelector('#memoInput');

const newMemoButton = document.querySelector('#newMemoButton');
const saveButton = document.querySelector('#saveButton');
const editButton = document.querySelector('#editButton');
const deleteButton = document.querySelector('#deleteButton');
const cancelButton = document.querySelector('#cancelButton');
const closeButton = document.querySelector('#closeButton');
const confirmDeleteButton = document.querySelector('#confirmDeleteButton');
const cancelDeleteButton = document.querySelector('#cancelDeleteButton');

let currentMemoId = null;
let mode = 'create';

async function loadMemos() {
  const response = await fetch('/api/memos');
  const memos = await response.json();

  memoList.innerHTML = '';

  if (memos.length === 0) {
    memoList.innerHTML = '<p class="empty">暂无备忘录</p>';
    return;
  }

  memos.forEach((memo) => {
    const item = document.createElement('article');
    item.className = 'memo-item';

    item.innerHTML = `
      <p class="memo-content">${escapeHtml(shorten(memo.content))}</p>
      <div class="memo-time">更新时间：${formatTime(memo.updated_at)}</div>
    `;

    item.addEventListener('click', () => openViewModal(memo.id));

    memoList.appendChild(item);
  });
}

async function openViewModal(id) {
  const response = await fetch(`/api/memos/${id}`);
  const memo = await response.json();

  currentMemoId = memo.id;
  mode = 'view';

  modalTitle.textContent = '查看备忘录';
  memoInput.value = memo.content;
  memoInput.disabled = true;

  saveButton.classList.add('hidden');
  editButton.classList.remove('hidden');
  deleteButton.classList.remove('hidden');
  cancelButton.classList.add('hidden');
  closeButton.classList.remove('hidden');

  modal.classList.remove('hidden');
}

function openCreateModal() {
  currentMemoId = null;
  mode = 'create';

  modalTitle.textContent = '新增备忘录';
  memoInput.value = '';
  memoInput.disabled = false;

  saveButton.classList.remove('hidden');
  editButton.classList.add('hidden');
  deleteButton.classList.add('hidden');
  cancelButton.classList.remove('hidden');
  closeButton.classList.add('hidden');

  modal.classList.remove('hidden');
  memoInput.focus();
}

function switchToEditMode() {
  mode = 'edit';

  modalTitle.textContent = '编辑备忘录';
  memoInput.disabled = false;
  memoInput.focus();

  saveButton.classList.remove('hidden');
  editButton.classList.add('hidden');
  deleteButton.classList.remove('hidden');
  cancelButton.classList.remove('hidden');
  closeButton.classList.add('hidden');
}

async function saveMemo() {
  const content = memoInput.value.trim();

  if (!content) {
    alert('请输入备忘录内容');
    return;
  }

  if (mode === 'create') {
    await fetch('/api/memos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
  }

  if (mode === 'edit') {
    await fetch(`/api/memos/${currentMemoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
  }

  closeModal();
  await loadMemos();
}

async function deleteMemo() {
  await fetch(`/api/memos/${currentMemoId}`, {
    method: 'DELETE'
  });

  confirmModal.classList.add('hidden');
  closeModal();
  await loadMemos();
}

function closeModal() {
  modal.classList.add('hidden');
  currentMemoId = null;
  mode = 'create';
}

function shorten(text) {
  return text.length > 80 ? `${text.slice(0, 80)}...` : text;
}

function formatTime(value) {
  return new Date(value).toLocaleString();
}

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

newMemoButton.addEventListener('click', openCreateModal);
saveButton.addEventListener('click', saveMemo);
editButton.addEventListener('click', switchToEditMode);
deleteButton.addEventListener('click', () => confirmModal.classList.remove('hidden'));
cancelButton.addEventListener('click', closeModal);
closeButton.addEventListener('click', closeModal);
confirmDeleteButton.addEventListener('click', deleteMemo);
cancelDeleteButton.addEventListener('click', () => confirmModal.classList.add('hidden'));

loadMemos();
