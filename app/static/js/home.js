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
    
    // Coletar dados do formulário
    const formData = {
        titulo: document.getElementById('title').value.trim(),
        autor: document.getElementById('author').value.trim(),
        editora: document.getElementById('publisher').value.trim(),
        edicao: document.getElementById('edition').value.trim(),
        isbn: document.getElementById('isbn').value.trim(),
        categorias: document.getElementById('categories').value.split(',').map(cat => cat.trim()).filter(cat => cat !== ''),
        ano: parseInt(document.getElementById('year').value) || null,
        localizacao: document.getElementById('location').value.trim(),
        exemplares_totais: parseInt(document.getElementById('copies').value) || 1
    };
    
    // Validar campos obrigatórios
    if (!formData.titulo || !formData.autor || !formData.editora || !formData.edicao || !formData.localizacao) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    // Verificar se o livro já existe (por ISBN ou título+autor)
    const livroExistente = booksData.find(livro => {
        // Se ambos têm ISBN, comparar por ISBN
        if (formData.isbn && livro.isbn && formData.isbn === livro.isbn) {
            return true;
        }
        // Caso contrário, comparar por título, autor, editora e edição
        return livro.titulo.toLowerCase() === formData.titulo.toLowerCase() && 
               livro.autor.toLowerCase() === formData.autor.toLowerCase() &&
               livro.editora.toLowerCase() === formData.editora.toLowerCase() &&
               livro.edicao.toLowerCase() === formData.edicao.toLowerCase();
    });
    
    if (livroExistente) {
        alert('Este livro já está cadastrado na base de dados!');
        return;
    }
    
    try {
        // Enviar requisição POST para adicionar o livro
        const response = await fetch('/api/books/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Recarregar lista de livros da API
            await carregarLivros();
            
            // Fechar modal e limpar formulário
            closeModal(add_modal);
            document.getElementById('addBookForm').reset();
            
            alert('Livro adicionado com sucesso!');
        } else {
            alert('Erro ao adicionar livro: ' + (result.message || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao adicionar livro:', error);
        alert('Erro ao conectar com o servidor.');
    }
}

function filterBooks(query) {
    query = query.toLowerCase();
    const rows = document.querySelectorAll('#booksTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}

function editBook(bookId) {
    // Buscar livro pelo ID no array booksData
    const bookData = booksData.find(livro => livro.id === bookId);
    
    if (!bookData) {
        alert('Livro não encontrado.');
        return;
    }
    
    // Preencher o formulário de edição com os dados do livro
    document.getElementById('edit-title').value = bookData.titulo;
    document.getElementById('edit-author').value = bookData.autor;
    document.getElementById('edit-publisher').value = bookData.editora;
    document.getElementById('edit-edition').value = bookData.edicao;
    document.getElementById('edit-isbn').value = bookData.isbn || '';
    document.getElementById('edit-categories').value = Array.isArray(bookData.categorias) 
        ? bookData.categorias.join(', ') 
        : bookData.categorias;
    document.getElementById('edit-year').value = bookData.ano || '';
    document.getElementById('edit-copies').value = bookData.exemplares_totais;
    document.getElementById('edit-location').value = bookData.localizacao;
    
    // Armazenar o ID do livro para usar no submit
    edit_modal.dataset.bookId = bookId;
    
    openModal(edit_modal);
}

async function handleEditBook(event) {
    event.preventDefault();
    
    // Obter o ID do livro armazenado no modal
    const bookId = parseInt(edit_modal.dataset.bookId);
    
    if (!bookId) {
        alert('Erro: ID do livro não encontrado.');
        return;
    }
    
    // Coletar dados do formulário
    const formData = {
        titulo: document.getElementById('edit-title').value.trim(),
        autor: document.getElementById('edit-author').value.trim(),
        editora: document.getElementById('edit-publisher').value.trim(),
        edicao: document.getElementById('edit-edition').value.trim(),
        isbn: document.getElementById('edit-isbn').value.trim(),
        categorias: document.getElementById('edit-categories').value.split(',').map(cat => cat.trim()).filter(cat => cat !== ''),
        ano: parseInt(document.getElementById('edit-year').value) || null,
        localizacao: document.getElementById('edit-location').value.trim(),
        exemplares_totais: parseInt(document.getElementById('edit-copies').value)
    };
    
    // Validar campos obrigatórios
    if (!formData.titulo || !formData.autor || !formData.editora || !formData.edicao || !formData.exemplares_totais) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    try {
        // Enviar requisição PUT para atualizar o livro
        const response = await fetch(`/api/books/${bookId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            // Recarregar lista de livros da API
            await carregarLivros();
            
            closeModal(edit_modal);
            alert('Livro atualizado com sucesso!');
        } else {
            const error = await response.json();
            alert('Erro ao atualizar livro: ' + (error.erro || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao atualizar livro:', error);
        alert('Erro ao conectar com o servidor.');
    }
}

async function deleteBook(bookId) {
    if (confirm('Tem certeza que deseja excluir este livro?')) {
        // Encontrar a linha antes de deletar para aplicar animação
        const row = event.target.closest('tr');
        
        try {
            // Deletar do banco de dados via API
            const response = await fetch(`/api/books/${bookId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Aplicar animação de fade out
                if (row) {
                    row.style.transition = 'opacity 0.8s';
                    row.style.opacity = '0';
                    
                    setTimeout(async () => {
                        // Recarregar lista de livros da API
                        await carregarLivros();
                    }, 300);
                }
                alert('Livro excluído com sucesso!');
            } else {
                alert('Erro ao excluir livro: ' + (result.message || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error('Erro ao excluir livro:', error);
            alert('Erro ao conectar com o servidor.');
        }
    }
}

function logout() {
    sessionStorage.removeItem('usuarioLogado');
    window.location.href = '../../../index.html';
}

function showBookDetails(bookId) {
    // Buscar livro pelo ID no array booksData
    const bookData = booksData.find(livro => livro.id === bookId);
    
    if (!bookData) {
        alert('Livro não encontrado.');
        return;
    }
    
    const exemplares_disponiveis = bookData.exemplares_totais - bookData.exemplares_emprestados;
    
    // Preenche as informações gerais
    document.getElementById('detail-title').textContent = bookData.titulo;
    document.getElementById('detail-author').textContent = bookData.autor;
    document.getElementById('detail-publisher').textContent = bookData.editora;
    document.getElementById('detail-edition').textContent = bookData.edicao;
    document.getElementById('detail-isbn').textContent = bookData.isbn || '-';
    document.getElementById('detail-categories').textContent = Array.isArray(bookData.categorias) 
        ? bookData.categorias.join(", ") 
        : bookData.categorias;
    document.getElementById('detail-year').textContent = bookData.ano || '-';
    document.getElementById('detail-location').textContent = bookData.localizacao;
    
    // Preenche a tabela de exemplares
    document.getElementById('detail-available-copies').textContent = exemplares_disponiveis;
    document.getElementById('detail-borrowed-copies').textContent = bookData.exemplares_emprestados;
    document.getElementById('detail-total-copies').textContent = bookData.exemplares_totais;
    
    // Armazena o ID do livro atual
    details_modal.dataset.currentBookId = bookId;
    
    // Gerenciar botões baseado no role do usuário e disponibilidade
    const borrowBtn = document.getElementById('btnBorrowFromDetails'); // Para funcionários (via CPF)
    const borrowDirectBtn = document.getElementById('btnBorrowDirectFromDetails'); // Para leitores
    const reserveBtn = document.getElementById('btnReserveFromDetails');
    
    if (usuarioLogado.role === 'funcionario') {
        // Funcionário: mostra botão de emprestar via CPF
        borrowBtn.style.display = 'inline-flex';
        borrowDirectBtn.style.display = 'none';
        reserveBtn.style.display = 'none';
        
        if (exemplares_disponiveis > 0) {
            borrowBtn.disabled = false;
            borrowBtn.style.opacity = '1';
        } else {
            borrowBtn.disabled = true;
            borrowBtn.style.opacity = '0.5';
            borrowBtn.title = 'Não há exemplares disponíveis';
        }
    } else {
        // Estudante/Professor: mostra botões de emprestar direto ou reservar
        borrowBtn.style.display = 'none';
        
        if (exemplares_disponiveis > 0) {
            // Há exemplares: mostra apenas botão de emprestar
            borrowDirectBtn.style.display = 'inline-flex';
            borrowDirectBtn.disabled = false;
            borrowDirectBtn.style.opacity = '1';
            reserveBtn.style.display = 'none';
        } else {
            // Não há exemplares: mostra apenas botão de reservar
            borrowDirectBtn.style.display = 'none';
            reserveBtn.style.display = 'inline-flex';
            reserveBtn.disabled = false;
            reserveBtn.style.opacity = '1';
        }
    }
    
    openModal(details_modal);
}

function borrowBook() {
    // Obter ID do livro do modal de detalhes
    const bookId = parseInt(details_modal.dataset.currentBookId);
    
    const bookData = booksData.find(livro => livro.id === bookId);
    
    if (!bookData) {
        alert('Livro não encontrado.');
        return;
    }
    
    const exemplares_disponiveis = bookData.exemplares_totais - bookData.exemplares_emprestados;
    
    if (exemplares_disponiveis <= 0) {
        alert('Não há exemplares disponíveis para empréstimo.');
        return;
    }
    
    // Armazena o ID do livro para usar após o CPF ser informado
    currentBorrowBookId = bookId;
    
    // Fecha o modal de detalhes e abre o modal de CPF
    closeModal(details_modal);
    openModal(cpf_modal);
}

async function handleBorrowWithCpf(event) {
    event.preventDefault();
    
    const cpf = document.getElementById('borrower-cpf').value.trim();
    
    if (!cpf) {
        alert('Por favor, informe o CPF do leitor.');
        return;
    }
    
    if (!currentBorrowBookId) {
        alert('Erro: livro não identificado.');
        return;
    }
    
    try {
        const response = await fetch('/api/emprestimos/emprestar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cpf_leitor: cpf,
                livro_id: currentBorrowBookId
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(`Livro "${result.livro}" emprestado com sucesso para ${result.leitor}!`);
            
            // Recarregar lista de livros
            await carregarLivros();
            
            // Limpar formulário e fechar modais
            document.getElementById('borrowCpfForm').reset();
            closeModal(cpf_modal);
            currentBorrowBookId = null;
        } else {
            alert(result.message || 'Erro ao realizar empréstimo.');
        }
    } catch (error) {
        console.error('Erro ao realizar empréstimo:', error);
        alert('Erro ao conectar com o servidor.');
    }
}

async function borrowBookDirect() {
    // Obter ID do livro do modal de detalhes
    const bookId = parseInt(details_modal.dataset.currentBookId);
    const bookData = booksData.find(livro => livro.id === bookId);
    
    if (!bookData) {
        alert('Livro não encontrado.');
        return;
    }
    
    const exemplares_disponiveis = bookData.exemplares_totais - bookData.exemplares_emprestados;
    
    // Empréstimo direto só é possível quando há exemplares disponíveis
    if (exemplares_disponiveis <= 0) {
        alert('Não há exemplares disponíveis. Você pode fazer uma reserva.');
        return;
    }
    
    if (!confirm(`Deseja emprestar o livro "${bookData.titulo}"?`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/emprestimos/emprestar-direto', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                livro_id: bookId
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(`Livro "${result.livro}" emprestado com sucesso! Data de devolução: ${result.data_devolucao}`);
            
            // Recarregar lista de livros
            await carregarLivros();
            
            // Fechar modal
            closeModal(details_modal);
        } else {
            alert(result.message || 'Erro ao realizar empréstimo.');
        }
    } catch (error) {
        console.error('Erro ao realizar empréstimo:', error);
        alert('Erro ao conectar com o servidor.');
    }
}

async function reserveBook() {
    // Obter ID do livro do modal de detalhes
    const bookId = parseInt(details_modal.dataset.currentBookId);
    const bookData = booksData.find(livro => livro.id === bookId);
    
    if (!bookData) {
        alert('Livro não encontrado.');
        return;
    }
    
    const exemplares_disponiveis = bookData.exemplares_totais - bookData.exemplares_emprestados;
    
    // Reserva só é possível quando NÃO há exemplares disponíveis
    if (exemplares_disponiveis > 0) {
        alert('Há exemplares disponíveis. Você pode emprestar o livro diretamente ao invés de reservar.');
        return;
    }
    
    if (!confirm(`Deseja reservar o livro "${bookData.titulo}"? Você entrará na fila de espera.`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/emprestimos/reservar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                livro_id: bookId
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(`Livro "${result.livro}" reservado com sucesso! Você está na posição ${result.posicao_fila} da fila de espera.`);
            
            // Recarregar lista de livros
            await carregarLivros();
            
            // Fechar modal
            closeModal(details_modal);
        } else {
            alert(result.message || 'Erro ao realizar reserva.');
        }
    } catch (error) {
        console.error('Erro ao realizar reserva:', error);
        alert('Erro ao conectar com o servidor.');
    }
}

function openBorrowsPage() {
    window.location.href = 'borrows.html';
}