const express = require('express');
const path = require('path');
const database = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/memos', (req, res) => {
  res.json(database.getAllMemos());
});

app.get('/api/memos/:id', (req, res) => {
  const memo = database.getMemo(req.params.id);

  if (!memo) {
    res.status(404).json({ error: 'Memo not found' });
    return;
  }

  res.json(memo);
});

app.post('/api/memos', (req, res) => {
  const content = req.body.content?.trim();

  if (!content) {
    res.status(400).json({ error: 'Content is required' });
    return;
  }

  res.status(201).json(database.createMemo(content));
});

app.put('/api/memos/:id', (req, res) => {
  const content = req.body.content?.trim();

  if (!content) {
    res.status(400).json({ error: 'Content is required' });
    return;
  }

  const memo = database.updateMemo(req.params.id, content);

  if (!memo) {
    res.status(404).json({ error: 'Memo not found' });
    return;
  }

  res.json(memo);
});

app.delete('/api/memos/:id', (req, res) => {
  const deleted = database.deleteMemo(req.params.id);

  if (!deleted) {
    res.status(404).json({ error: 'Memo not found' });
    return;
  }

  res.json({ success: true });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Memo app is running at http://localhost:${PORT}`);
  });
}

module.exports = app;
