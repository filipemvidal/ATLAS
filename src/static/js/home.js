const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));
const closeBtns = document.querySelectorAll('.close');
const add_modal = document.getElementById('addBookModal');
const edit_modal = document.getElementById('editBookModal');
const details_modal = document.getElementById('bookDetailsModal');
const cpf_modal = document.getElementById('borrowCpfModal');
const total_books = document.getElementById('total-number');
const total_available = document.getElementById('total-available');
const total_borrowed = document.getElementById('total-borrowed');

// Armazena informações dos livros (exemplares disponíveis e emprestados)
let booksData = [];
let currentBorrowBookIndex = null; // Armazena o índice do livro sendo emprestado

function openBookModal(modal){
    modal.style.display = 'block';
}

function closeBookModal(modal){
    modal.style.display = 'none';
}

closeBtns.forEach(btn => {
    btn.onclick = function() {
        const modal = btn.closest('.modal');
        if (modal) {
            closeBookModal(modal);
        }
    };
});

async function handleAddBook(event) {
    event.preventDefault();
    
    const formData = {
        title: document.getElementById('title').value,
        author: document.getElementById('author').value,
        publisher: document.getElementById('publisher').value ,
        edition: document.getElementById('edition').value ,
        isbn: document.getElementById('isbn').value || '-',
        categories: document.getElementById('categories').value.split(',').map(cat => cat.trim()),
        year: parseInt(document.getElementById('year').value) || new Date().getFullYear(),
        copies: parseInt(document.getElementById('copies').value) || 1,
        location: document.getElementById('location').value
    };
    console.log('Adding book with data:', formData);

    addBook(formData);
    document.getElementById("addBookForm").reset();
    closeBookModal(add_modal);
}

function filterBooks(query) {
    query = query.toLowerCase();
    const rows = document.querySelectorAll('#booksTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}

function editBook() {
    const row = event.target.closest('tr');
    
    if (row) {
        const cells = row.cells;
        const title = cells[0].textContent;
        const author = cells[1].textContent;
        const publisher = cells[2].textContent;
        const edition = cells[3].textContent;
        const isbn = cells[4].textContent;
        const categories = cells[5].textContent;
        const year = cells[6].textContent;
        const copies = cells[7].textContent;
        const location = cells[8].textContent;
        
        document.getElementById('edit-title').value = title;
        document.getElementById('edit-author').value = author;
        document.getElementById('edit-publisher').value = publisher;
        document.getElementById('edit-edition').value = edition;
        document.getElementById('edit-isbn').value = isbn;
        document.getElementById('edit-categories').value = categories;
        document.getElementById('edit-year').value = year;
        document.getElementById('edit-copies').value = copies;
        document.getElementById('edit-location').value = location;
        
        edit_modal.dataset.editingRow = row.rowIndex;
        edit_modal.dataset.bookIndex = row.dataset.bookIndex;
        
        openBookModal(edit_modal);
    }
}

async function handleEditBook(event) {
    event.preventDefault();
    
    const rowIndex = edit_modal.dataset.editingRow;
    const bookIndex = parseInt(edit_modal.dataset.bookIndex);
    const row = document.querySelector(`#booksTableBody tr:nth-child(${rowIndex})`);
    
    if (row) {
        const formData = {
            title: document.getElementById('edit-title').value,
            author: document.getElementById('edit-author').value,
            publisher: document.getElementById('edit-publisher').value,
            edition: document.getElementById('edit-edition').value,
            isbn: document.getElementById('edit-isbn').value || '-',
            categories: document.getElementById('edit-categories').value,
            year: document.getElementById('edit-year').value,
            copies: parseInt(document.getElementById('edit-copies').value) || 0,
            location: document.getElementById('edit-location').value
        };
        
        row.cells[0].textContent = formData.title;
        row.cells[1].textContent = formData.author;
        row.cells[2].textContent = formData.publisher;
        row.cells[3].textContent = formData.edition;
        row.cells[4].textContent = formData.isbn;
        row.cells[5].textContent = formData.categories;
        row.cells[6].textContent = formData.year;
        row.cells[7].textContent = formData.copies;
        row.cells[8].textContent = formData.location;
        
        // Atualiza os dados do livro no array
        const currentAvailable = booksData[bookIndex].availableCopies;
        const currentBorrowed = booksData[bookIndex].borrowedCopies;
        const currentTotal = booksData[bookIndex].totalCopies;
        const newTotal = formData.copies;
        
        booksData[bookIndex] = {
            ...formData,
            categories: formData.categories.split(',').map(cat => cat.trim()),
            availableCopies: currentAvailable + (newTotal - currentTotal),
            borrowedCopies: currentBorrowed,
            totalCopies: newTotal
        };

        total_books.textContent = parseInt(total_books.textContent) + newTotal - currentTotal;
        total_available.textContent = parseInt(total_available.textContent) + newTotal - currentTotal;
        
        console.log('Livro editado:', formData);
        
        closeBookModal(edit_modal);
        
        document.getElementById('editBookForm').reset();
    }
}

function deleteBook() {
    if (confirm('Tem certeza que deseja excluir este livro?')) {
        const row = event.target.closest('tr');
        
        if (row) {
            const bookIndex = parseInt(row.dataset.bookIndex);
            const bookData = booksData[bookIndex];
            
            row.style.transition = 'opacity 0.3s';
            row.style.opacity = '0';
            
            setTimeout(() => {
                row.remove();
                // Remove o livro do array
                booksData[bookIndex] = null; // Marca como null ao invés de remover para manter os índices
                console.log('Livro deletado');
            }, 300);
            
            total_books.textContent = parseInt(total_books.textContent) - bookData.totalCopies;
            total_available.textContent = parseInt(total_available.textContent) - bookData.availableCopies;
            total_borrowed.textContent = parseInt(total_borrowed.textContent) - bookData.borrowedCopies;
        }
    }
}

function logout() {
    sessionStorage.removeItem('usuarioLogado');
    window.location.href = '../../../index.html';
}

function addBook(formData)
{
    // Adiciona informações do livro ao array de dados
    const bookData = {
        ...formData,
        availableCopies: formData.copies || 0,
        borrowedCopies: 0,
        totalCopies: formData.copies || 0
    };
    const bookIndex = booksData.length;
    booksData.push(bookData);
    
    const actionColumn = usuarioLogado.role === 'Funcionario' ? `
        <td class="actions" onclick="event.stopPropagation()">
            <button class="btn-icon" onclick="editBook()">
                <i class="fas fa-pen"></i>
            </button>
            <button class="btn-icon" onclick="deleteBook()">
                <i class="fas fa-trash"></i>
            </button>
        </td>` : '';
    
    const row = document.createElement('tr');
    row.dataset.bookIndex = bookIndex; // Armazena o índice no elemento
    row.onclick = function(e) {
        // Não abre o modal se clicar nos botões de ação
        if (!e.target.closest('.actions')) {
            const index = parseInt(this.dataset.bookIndex);
            showBookDetails(index);
        }
    };
    
    row.innerHTML = `
        <td>${formData.title}</td>
        <td>${formData.author}</td>
        <td>${formData.publisher}</td>
        <td>${formData.edition}</td>
        <td>${formData.isbn || '-'}</td>
        <td>${Array.isArray(formData.categories) ? formData.categories.join(", ") : formData.categories}</td>
        <td>${formData.year}</td>
        <td>${formData.copies || 0}</td>
        <td>${formData.location}</td>
        ${actionColumn}
    `;
    
    document.getElementById('booksTableBody').appendChild(row);
    total_books.textContent = parseInt(total_books.textContent) + 1;
}

function showBookDetails(bookIndex) {
    const bookData = booksData[bookIndex];
    
    if (!bookData || bookData === null) return;
    
    // Preenche as informações gerais
    document.getElementById('detail-title').textContent = bookData.title;
    document.getElementById('detail-author').textContent = bookData.author;
    document.getElementById('detail-publisher').textContent = bookData.publisher;
    document.getElementById('detail-edition').textContent = bookData.edition;
    document.getElementById('detail-isbn').textContent = bookData.isbn || '-';
    document.getElementById('detail-categories').textContent = Array.isArray(bookData.categories) 
        ? bookData.categories.join(", ") 
        : bookData.categories;
    document.getElementById('detail-year').textContent = bookData.year;
    document.getElementById('detail-location').textContent = bookData.location;
    
    // Preenche a tabela de exemplares
    document.getElementById('detail-available-copies').textContent = bookData.availableCopies;
    document.getElementById('detail-borrowed-copies').textContent = bookData.borrowedCopies;
    document.getElementById('detail-total-copies').textContent = bookData.totalCopies;
    
    // Armazena o índice do livro atual
    details_modal.dataset.currentBookIndex = bookIndex;
    
    // Mostra/esconde o botão de empréstimo baseado no papel do usuário e disponibilidade
    const borrowBtn = document.getElementById('btnBorrowFromDetails');
    const modalFooter = document.getElementById('details-modal-footer');
    
    // if (usuarioLogado.role === 'Funcionario') {
        modalFooter.style.display = 'flex';
        if (bookData.availableCopies > 0) {
            borrowBtn.disabled = false;
            borrowBtn.style.opacity = '1';
        } else {
            borrowBtn.disabled = true;
            borrowBtn.style.opacity = '0.5';
            borrowBtn.title = 'Não há exemplares disponíveis';
        }
    // } else {
    //     modalFooter.style.display = 'none';
    // }
    
    openBookModal(details_modal);
}

function borrowBook() {
    const bookIndex = parseInt(details_modal.dataset.currentBookIndex);
    const bookData = booksData[bookIndex];
    
    if (!bookData || bookData.availableCopies <= 0) {
        alert('Não há exemplares disponíveis para empréstimo.');
        return;
    }
    
    // Armazena o índice do livro para usar após o CPF ser informado
    currentBorrowBookIndex = bookIndex;
    
    // Fecha o modal de detalhes e abre o modal de CPF
    closeBookModal(details_modal);
    openBookModal(cpf_modal);
}

function handleBorrowWithCpf(event) {
    event.preventDefault();
    
    const cpf = document.getElementById('borrower-cpf').value;
    
    if (!cpf || cpf.trim() === '') {
        alert('Por favor, informe o CPF do leitor.');
        return;
    }
    
    if (currentBorrowBookIndex === null) {
        alert('Erro: livro não identificado.');
        return;
    }
    
    const bookData = booksData[currentBorrowBookIndex];
    
    if (bookData && bookData.availableCopies > 0) {
        // Atualiza os dados do livro
        bookData.availableCopies -= 1;
        bookData.borrowedCopies += 1;
        
        // Atualiza a tabela (encontra a linha correspondente)
        const rows = document.querySelectorAll('#booksTableBody tr');
        rows.forEach(row => {
            if (parseInt(row.dataset.bookIndex) === currentBorrowBookIndex) {
                row.cells[7].textContent = bookData.availableCopies;
            }
        });
        
        // Atualiza os totais
        total_available.textContent = parseInt(total_available.textContent) - 1;
        total_borrowed.textContent = parseInt(total_borrowed.textContent) + 1;
        
        alert(`Livro "${bookData.title}" emprestado com sucesso para o CPF ${cpf}!`);
        
        // Limpa o formulário e fecha o modal
        document.getElementById('borrowCpfForm').reset();
        closeBookModal(cpf_modal);
        currentBorrowBookIndex = null;
    } else {
        alert('Não há exemplares disponíveis para empréstimo.');
    }
}

function openBorrowsPage() {
    window.location.href = 'borrows.html';
}

const livros = [
    {
        title: "Dom Casmurro",
        author: "Machado de Assis",
        publisher: "Companhia das Letras",
        edition: "1ª",
        isbn: "9788544001080",
        categories: ["Romance", "Literatura Brasileira"],
        year: 1899,
        copies: 3,
        location: "Estante A, Prateleira 1"
    },
    {
        title: "O Cortiço",
        author: "Aluísio Azevedo",
        publisher: "Ática",
        edition: "2ª",
        isbn: "9788508040414",
        categories: ["Romance", "Naturalismo"],
        year: 1890,
        copies: 2,
        location: "Estante A, Prateleira 2"
    },
    {
        title: "Grande Sertão: Veredas",
        author: "Guimarães Rosa",
        publisher: "Nova Fronteira",
        edition: "1ª",
        isbn: "9788535908770",
        categories: ["Romance", "Literatura Brasileira"],
        year: 1956,
        copies: 1,
        location: "Estante B, Prateleira 1"
    },
    {
        title: "Capitães da Areia",
        author: "Jorge Amado",
        publisher: "Companhia das Letras",
        edition: "3ª",
        isbn: "9788535914063",
        categories: ["Romance", "Drama"],
        year: 1937,
        copies: 4,
        location: "Estante B, Prateleira 3"
    },
    {
        title: "Memórias Póstumas de Brás Cubas",
        author: "Machado de Assis",
        publisher: "Companhia das Letras",
        edition: "1ª",
        isbn: "9788544001073",
        categories: ["Romance", "Realismo"],
        year: 1881,
        copies: 2,
        location: "Estante A, Prateleira 1"
    }
];

if (!usuarioLogado) {
    alert('Você precisa fazer login primeiro!');
    window.location.href = 'index.html';
}

const addBookBtn = document.getElementById('addBookBtn');
const openReadersBtn = document.getElementById('openReadersBtn');
const openBorrowsBtn = document.getElementById('borrowsBtn');
if(usuarioLogado.role === 'Funcionario') {
    openBorrowsBtn.style.display = 'none';
} else {
    addBookBtn.style.display = 'none';
    openReadersBtn.style.display = 'none';
    const actionHeader = document.querySelector('th.actions');
    if (actionHeader) {
        actionHeader.style.display = 'none';
    }
    const subtitle = document.querySelector('.logo p');
    subtitle.textContent = `Bem-vindo(a), ${usuarioLogado.nome}`;
}

livros.forEach(livro => {
    addBook(livro);
});

const totalCopies = livros.reduce((sum, livro) => sum + (livro.copies || 0), 0);
total_books.textContent = totalCopies;
total_available.textContent = totalCopies; 
total_borrowed.textContent = 0;