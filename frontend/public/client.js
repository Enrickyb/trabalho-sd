async function sendRequest(endpoint, data) {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (err) {
        throw new Error('Falha na requisição: ' + err.message);
    }
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.style.display = 'block';
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

async function listBooks() {
    try {
        const response = await sendRequest('/list-books', {});
        const books = response.books;
        const tableBody = document.getElementById('booksBody');
        tableBody.innerHTML = '';
        books.forEach(book => {
            const row = document.createElement('tr');
            row.innerHTML = `
          <td>${book.id}</td>
          <td>${book.title}</td>
          <td>${book.quantity}</td>
        `;
            tableBody.appendChild(row);
        });
        document.getElementById('booksTable').style.display = 'table';
        showMessage('Livros listados com sucesso!', 'success');
    } catch (err) {
        showMessage('Erro: ' + err.message, 'error');
    }
}

async function checkAvailability() {
    const bookId = document.getElementById('bookId').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    if (!quantity || quantity < 1) {
        showMessage('Por favor, insira uma quantidade válida.', 'error');
        return;
    }
    try {
        const response = await sendRequest('/check-availability', { book_id: bookId, quantity });
        if (response.available) {
            showMessage(`Livro ${bookId} disponível! Quantidade em estoque: ${response.quantity}`, 'success');
        } else {
            showMessage(`Livro ${bookId} não disponível para a quantidade solicitada.`, 'error');
        }
    } catch (err) {
        showMessage('Erro: ' + err.message, 'error');
    }
}

async function placeOrder() {
    const bookId = document.getElementById('bookId').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    if (!quantity || quantity < 1) {
        showMessage('Por favor, insira uma quantidade válida.', 'error');
        return;
    }
    try {
        const response = await sendRequest('/place-order', { book_id: bookId, quantity });
        if (response.status === 'Order placed') {
            showMessage(`Pedido realizado com sucesso! ID do pedido: ${response.order_id}`, 'success');
        } else {
            showMessage(`Falha ao realizar o pedido: ${response.status}`, 'error');
        }
    } catch (err) {
        showMessage('Erro: ' + err.message, 'error');
    }
}