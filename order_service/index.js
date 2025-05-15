const net = require('net');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('orders.db', (err) => {
    if (err) {
        console.error('Database error:', err.message);
        return;
    }
    db.run(`CREATE TABLE IF NOT EXISTS orders (
    order_id TEXT PRIMARY KEY,
    book_id TEXT,
    quantity INTEGER
  )`, (err) => {
        if (err) console.error('Table creation error:', err.message);
    });
});

function checkAvailability(book_id, quantity) {
    return new Promise((resolve) => {
        const client = new net.Socket();
        client.connect(5000, 'localhost', () => {
            client.write(JSON.stringify({ action: 'check_availability', book_id, quantity }));
        });
        client.on('data', (data) => {
            resolve(JSON.parse(data.toString()));
            client.destroy();
        });
        client.on('error', () => {
            resolve({ available: false });
            client.destroy();
        });
    });
}

function updateStock(book_id, quantity) {
    return new Promise((resolve) => {
        const client = new net.Socket();
        client.connect(5000, 'localhost', () => {
            client.write(JSON.stringify({ action: 'update_stock', book_id, quantity }));
        });
        client.on('data', (data) => {
            resolve(JSON.parse(data.toString()));
            client.destroy();
        });
        client.on('error', () => {
            resolve({ success: false });
            client.destroy();
        });
    });
}

const server = net.createServer((socket) => {
    socket.on('data', async (data) => {
        const request = JSON.parse(data.toString());
        if (request.action === 'place_order') {
            const availability = await checkAvailability(request.book_id, request.quantity);
            if (!availability.available) {
                socket.write(JSON.stringify({ status: 'Order failed: Book unavailable' }));
                socket.end();
                return;
            }
            const stockUpdate = await updateStock(request.book_id, request.quantity);
            if (!stockUpdate.success) {
                socket.write(JSON.stringify({ status: 'Order failed: Stock update failed' }));
                socket.end();
                return;
            }
            const order_id = Date.now().toString();
            db.run(`INSERT INTO orders (order_id, book_id, quantity) VALUES (?, ?, ?)`,
                [order_id, request.book_id, request.quantity], (err) => {
                    if (err) {
                        socket.write(JSON.stringify({ status: 'Order failed: Database error' }));
                    } else {
                        socket.write(JSON.stringify({ status: 'Order placed', order_id }));
                    }
                    socket.end();
                });
        }
    });
});

server.listen(5001, 'localhost', () => {
    console.log('Order Service running on localhost:5001');
});