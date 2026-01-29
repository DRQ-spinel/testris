// server.js
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// publicフォルダを静的ファイルとして公開
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Tetracore server running at http://localhost:${PORT}`);
});