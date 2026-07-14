const express = require('express');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/memos', (req, res) => {
  db.all('SELECT * FROM memos ORDER BY updated_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Failed to load memos' });
      return;
    }

    res.json(rows);
  });
});

app.get('/api/memos/:id', (req, res) => {
  db.get('SELECT * FROM memos WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: 'Failed to load memo' });
      return;
    }

    if (!row) {
      res.status(404).json({ error: 'Memo not found' });
      return;
    }

    res.json(row);
  });
});

app.post('/api/memos', (req, res) => {
  const content = req.body.content?.trim();

  if (!content) {
    res.status(400).json({ error: 'Content is required' });
    return;
  }

  const now = new Date().toISOString();

  db.run(
    'INSERT INTO memos (content, created_at, updated_at) VALUES (?, ?, ?)',
    [content, now, now],
    function handleInsert(err) {
      if (err) {
        res.status(500).json({ error: 'Failed to create memo' });
        return;
      }

      res.status(201).json({
        id: this.lastID,
        content,
        created_at: now,
        updated_at: now
      });
    }
  );
});

app.put('/api/memos/:id', (req, res) => {
  const content = req.body.content?.trim();

  if (!content) {
    res.status(400).json({ error: 'Content is required' });
    return;
  }

  const now = new Date().toISOString();

  db.run(
    'UPDATE memos SET content = ?, updated_at = ? WHERE id = ?',
    [content, now, req.params.id],
    function handleUpdate(err) {
      if (err) {
        res.status(500).json({ error: 'Failed to update memo' });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: 'Memo not found' });
        return;
      }

      res.json({
        id: Number(req.params.id),
        content,
        updated_at: now
      });
    }
  );
});

app.delete('/api/memos/:id', (req, res) => {
  db.run('DELETE FROM memos WHERE id = ?', [req.params.id], function handleDelete(err) {
    if (err) {
      res.status(500).json({ error: 'Failed to delete memo' });
      return;
    }

    if (this.changes === 0) {
      res.status(404).json({ error: 'Memo not found' });
      return;
    }

    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Memo app is running at http://localhost:${PORT}`);
});
