// Carregar dados do usuário logado do Flask
const usuarioLogado = JSON.parse(document.getElementById('usuario-data').textContent);

const closeBtns = document.querySelectorAll('.close');
const add_modal = document.getElementById('addBookModal');
const edit_modal = document.getElementById('editBookModal');
const details_modal = document.getElementById('bookDetailsModal');
const cpf_modal = document.getElementById('borrowCpfModal');
const total_books = document.getElementById('total-number');
const total_available = document.getElementById('total-available');
const total_borrowed = document.getElementById('total-borrowed');

let booksData = [];
let currentBorrowBookId = null;

// Carregar livros ao iniciar a página
async function carregarLivros() {
    try {
        const response = await fetch('/api/books/');
        const livros = await response.json();
        
        // Limpar tabela
        document.getElementById('booksTableBody').innerHTML = '';
        booksData = livros;
        
        // Adicionar cada livro na tabela
        livros.forEach(livro => {
            addBook(livro);
        });
        
        // Atualizar totais
        atualizarTotais();
    } catch (error) {
        console.error('Erro ao carregar livros:', error);
        alert('Erro ao carregar livros. Tente novamente.');
    }
}

function atualizarTotais() {
    let totalExemplares = 0;
    let totalEmprestados = 0;
    
    booksData.forEach(livro => {
        totalExemplares += livro.exemplares_totais || 0;
        totalEmprestados += livro.exemplares_emprestados || 0;
    });
    
    total_books.textContent = totalExemplares;
    total_available.textContent = totalExemplares - totalEmprestados;
    total_borrowed.textContent = totalEmprestados;
}

// Carregar livros quando a página é carregada
carregarLivros();

// Ajusta a interface com base no papel do usuário
const addBookBtn = document.getElementById('addBookBtn');
const openReadersBtn = document.getElementById('openReadersBtn');
const openBorrowsBtn = document.getElementById('borrowsBtn');
if(usuarioLogado.role === 'funcionario') {
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

// Funções de gerenciamento de modais
function openModal(modal){
    modal.style.display = 'block';
}

function closeModal(modal){
    modal.style.display = 'none';
}

closeBtns.forEach(btn => {
    btn.onclick = function() {
        const modal = btn.closest('.modal');
        if (modal) {
            closeModal(modal);
        }
    };
});

// Fecha os modais ao clicar fora do conteúdo
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target);
    }
};

function openAddBookModal() {
    openModal(add_modal);
}

function addBook(bookData)
{
    const actionColumn = usuarioLogado.role === 'funcionario' ? `
        <td class="actions" onclick="event.stopPropagation()">
            <button class="btn-icon" onclick="editBook(${bookData.id})">
                <i class="fas fa-pen"></i>
            </button>
            <button class="btn-icon" onclick="deleteBook(${bookData.id})">
                <i class="fas fa-trash"></i>
            </button>
        </td>` : '';
    
    const row = document.createElement('tr');
    row.dataset.bookId = bookData.id;
    row.onclick = function(e) {
        if (!e.target.closest('.actions')) {
            showBookDetails(bookData.id);
        }
    };
    
    const exemplares_disponiveis = bookData.exemplares_totais - bookData.exemplares_emprestados;
    
    row.innerHTML = `
        <td>${bookData.titulo}</td>
        <td>${bookData.autor}</td>
        <td>${bookData.editora}</td>
        <td>${bookData.edicao}</td>
        <td>${Array.isArray(bookData.categorias) ? bookData.categorias.join(", ") : bookData.categorias}</td>
        <td>${bookData.ano || '-'}</td>
        <td>${exemplares_disponiveis}</td>
        <td>${bookData.localizacao}</td>
        <td>${bookData.isbn || '-'}</td>
        ${actionColumn}
    `;
    
    document.getElementById('booksTableBody').appendChild(row);
}

async function handleAddBook(event) {
    event.preventDefault();
    
    // TO-DO: Adicionar livro na base de dados

    // DELETE
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
    // FIM-DELETE

    addBook(formData);
    document.getElementById("addBookForm").reset();
    closeModal(add_modal);
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
        // TO-DO: Carregar dados do livro a partir da base de dados

        // DELETE
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
        // FIM-DELETE
        
        openModal(edit_modal);
    }
}

async function handleEditBook(event) {
    event.preventDefault();
    
    // DELETE
    const rowIndex = edit_modal.dataset.editingRow;
    const bookIndex = parseInt(edit_modal.dataset.bookIndex);
    const row = document.querySelector(`#booksTableBody tr:nth-child(${rowIndex})`);
    // FIM-DELETE
    
    
    if (row) {
        // TO-DO: Buscar dados antigos na base de dados
        // TO-DO: Atualizar dados do livro na base de dados

        // DELETE
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
        // FIM-DELETE
        
        closeModal(edit_modal);
        
        document.getElementById('editBookForm').reset();
    }
}

function deleteBook() {
    if (confirm('Tem certeza que deseja excluir este livro?')) {
        const row = event.target.closest('tr');
        
        if (row) {
            // DELETE
            const bookIndex = parseInt(row.dataset.bookIndex);
            const bookData = booksData[bookIndex];
            // FIM-DELETE
            
            row.style.transition = 'opacity 0.3s';
            row.style.opacity = '0';
            
            setTimeout(() => {
                row.remove();
                // DELETE
                booksData[bookIndex] = null; // Marca como null ao invés de remover para manter os índices
                console.log('Livro deletado');
                // FIM-DELETE
            }, 300);
            
            // DELETE
            total_books.textContent = parseInt(total_books.textContent) - bookData.totalCopies;
            total_available.textContent = parseInt(total_available.textContent) - bookData.availableCopies;
            total_borrowed.textContent = parseInt(total_borrowed.textContent) - bookData.borrowedCopies;
            // FIM-DELETE
        }
    }
}

function logout() {
    sessionStorage.removeItem('usuarioLogado');
    window.location.href = '../../../index.html';
}

function showBookDetails(bookIndex) {
    // TO-DO: Buscar dados do livro a partir da base de dados

    // DELETE
    const bookData = booksData[bookIndex];
    // FIM-DELETE
    
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
    
    // Mostra/esconde o botão de empréstimo baseado na disponibilidade
    const borrowBtn = document.getElementById('btnBorrowFromDetails');
        if (bookData.availableCopies > 0) {
            borrowBtn.disabled = false;
            borrowBtn.style.opacity = '1';
        } else {
            borrowBtn.disabled = true;
            borrowBtn.style.opacity = '0.5';
            borrowBtn.title = 'Não há exemplares disponíveis';
        }
    
    openModal(details_modal);
}

function borrowBook() {
    // TO-DO: Lógica de empréstimo do livro
    // TO-DO: Buscar dados do livro a partir da base de dados

    // DELETE
    const bookIndex = parseInt(details_modal.dataset.currentBookIndex);
    const bookData = booksData[bookIndex];
    // FIM-DELETE
    
    if (!bookData || bookData.availableCopies <= 0) {
        alert('Não há exemplares disponíveis para empréstimo.');
        return;
    }
    
    // Armazena o índice do livro para usar após o CPF ser informado
    currentBorrowBookIndex = bookIndex; // DELETE
    
    // Fecha o modal de detalhes e abre o modal de CPF
    openModal(cpf_modal);
}

function handleBorrowWithCpf(event) {
    event.preventDefault();
    
    const cpf = document.getElementById('borrower-cpf').value;
    
    if (!cpf || cpf.trim() === '') {
        alert('Por favor, informe o CPF do leitor.');
        return;
    }
    
    // DELETE
    if (currentBorrowBookIndex === null) {
        alert('Erro: livro não identificado.');
        return;
    }
    // FIM-DELETE
    
    // TO-DO: Verificar se o CPF é válido e se o leitor existe na base de dados
    // TO-DO: Registrar o empréstimo na base de dados
    
    const bookData = booksData[currentBorrowBookIndex];
    
    if (bookData && bookData.availableCopies > 0) {
        // DELETE
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
        // FIM-DELETE
        
        alert(`Livro "${bookData.title}" emprestado com sucesso para o CPF ${cpf}!`);
        
        // Limpa o formulário e fecha o modal
        document.getElementById('borrowCpfForm').reset();
        closeModal(cpf_modal);
        closeModal(details_modal);
        currentBorrowBookIndex = null; // DELETE
    } else {
        alert('Não há exemplares disponíveis para empréstimo.');
    }
}

function openBorrowsPage() {
    window.location.href = 'borrows.html';
}