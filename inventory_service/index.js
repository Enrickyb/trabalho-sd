const net = require('net');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('inventory.db', (err) => {
    if (err) console.error('Database error:', err.message);
    db.run(`CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    title TEXT,
    quantity INTEGER
  )`, (err) => {
        if (err) console.error('Table creation error:', err.message);

        db.run(`INSERT OR IGNORE INTO books (id, title, quantity) VALUES (?, ?, ?)`, ['1', 'JavaScript Book', 5]);
        db.run(`INSERT OR IGNORE INTO books (id, title, quantity) VALUES (?, ?, ?)`, ['2', 'Clean Code', 2]);
        db.run(`INSERT OR IGNORE INTO books (id, title, quantity) VALUES (?, ?, ?)`, ['3', 'Go Horse', 8]);
        db.run(`INSERT OR IGNORE INTO books (id, title, quantity) VALUES (?, ?, ?)`, ['4', 'Database Systems', 6]);

    });
});

const server = net.createServer((socket) => {
    socket.on('data', (data) => {
        let request;
        try {
            request = JSON.parse(data.toString());
        } catch (err) {
            socket.write(JSON.stringify({ error: 'Invalid JSON' }));
            socket.end();
            return;
        }

        if (request.action === 'list_books') {
            db.all('SELECT * FROM books', [], (err, rows) => {
                if (err) {
                    if (!socket.writableEnded) {
                        socket.write(JSON.stringify({ error: err.message }));
                        socket.end();
                    }
                    return;
                }
                if (!socket.writableEnded) {
                    socket.write(JSON.stringify({ books: rows }));
                    socket.end();
                }
            });
        } else if (request.action === 'check_availability') {
            db.get('SELECT quantity FROM books WHERE id = ?', [request.book_id], (err, row) => {
                if (err || !row) {
                    if (!socket.writableEnded) {
                        socket.write(JSON.stringify({ available: false }));
                        socket.end();
                    }
                    return;
                }
                if (!socket.writableEnded) {
                    socket.write(JSON.stringify({
                        book_id: request.book_id,
                        available: row.quantity >= request.quantity,
                        quantity: row.quantity
                    }));
                    socket.end();
                }
            });
        } else if (request.action === 'update_stock') {
            db.run('UPDATE books SET quantity = quantity - ? WHERE id = ? AND quantity >= ?',
                [request.quantity, request.book_id, request.quantity], function (err) {
                    if (err || this.changes === 0) {
                        if (!socket.writableEnded) {
                            socket.write(JSON.stringify({ success: false }));
                            socket.end();
                        }
                        return;
                    }
                    if (!socket.writableEnded) {
                        socket.write(JSON.stringify({ success: true }));
                        socket.end();
                    }
                });
        } else {
            if (!socket.writableEnded) {
                socket.write(JSON.stringify({ error: 'Invalid action' }));
                socket.end();
            }
        }
    });

    socket.on('error', (err) => {
        console.error('Socket error:', err.message);
    });
});

server.listen(5000, 'localhost', () => {
    console.log('Inventory Service running on localhost:5000');
});