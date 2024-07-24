const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database
const db = new sqlite3.Database('./chat.db', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user TEXT,
      message TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('A user connected');

  // Load previous messages
  db.all('SELECT * FROM messages ORDER BY timestamp DESC LIMIT 10', (err, rows) => {
    if (err) {
      console.error('Error fetching messages', err);
    } else {
      socket.emit('load previous messages', rows.reverse());
    }
  });

  socket.on('chat message', (msg) => {
    const { user, message } = msg;
    
    // Save message to database
    db.run('INSERT INTO messages (user, message) VALUES (?, ?)', [user, message], (err) => {
      if (err) {
        console.error('Error saving message', err);
      } else {
        io.emit('chat message', msg);
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});