const express = require('express');
const path = require('path');
const net = require('net');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

function sendTcpRequest(host, port, request) {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        client.connect(port, host, () => {
            client.write(JSON.stringify(request));
        });
        client.on('data', (data) => {
            resolve(JSON.parse(data.toString()));
            client.destroy();
        });
        client.on('error', (err) => {
            reject(err);
            client.destroy();
        });
    });
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/list-books', async (req, res) => {
    try {
        const response = await sendTcpRequest('localhost', 5000, { action: 'list_books' });
        res.json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/check-availability', async (req, res) => {
    const { book_id, quantity } = req.body;
    try {
        const response = await sendTcpRequest('localhost', 5000, {
            action: 'check_availability',
            book_id,
            quantity
        });
        res.json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/place-order', async (req, res) => {
    const { book_id, quantity } = req.body;
    try {
        const response = await sendTcpRequest('localhost', 5001, {
            action: 'place_order',
            book_id,
            quantity
        });
        res.json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => {
    console.log('Frontend running on http://localhost:3000');
});