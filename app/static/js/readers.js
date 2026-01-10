const readerModal = document.getElementById('readerDetailsModal');
const bookModal = document.getElementById('bookDetailsModal');

let readersData = [];

// Carregar leitores ao inicializar a página
window.addEventListener('DOMContentLoaded', async () => {
    await carregarLeitores();
});

async function carregarLeitores() {
    try {
        const response = await fetch('/api/usuarios');
        
        if (response.ok) {
            readersData = await response.json();
            
            // Limpar tabela
            const tableBody = document.getElementById('readersTableBody');
            tableBody.innerHTML = '';
            
            // Adicionar cada leitor na tabela
            readersData.forEach(reader => {
                addReaderRow(reader);
            });
        } else {
            console.error('Erro ao carregar leitores');
            alert('Erro ao carregar lista de leitores.');
        }
    } catch (error) {
        console.error('Erro ao conectar com o servidor:', error);
        alert('Erro ao conectar com o servidor.');
    }
}

// Funções de gerenciamento de modais
function openModal(modal){
    modal.style.display = 'block';
}

function closeModal(modal){
    modal.style.display = 'none';
}

// Fecha os modais ao clicar no botão de fechar
const closeBtns = document.querySelectorAll('.close');
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

function logout() {
    sessionStorage.removeItem('usuarioLogado');
    window.location.href = 'index.html';
}

function filterReaders(query) {
    query = query.toLowerCase();
    const rows = document.querySelectorAll('#readersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}

function addReaderRow(reader)
{
    const tableBody = document.getElementById('readersTableBody');
    const row = document.createElement('tr');
    
    row.style.cursor = 'pointer';
    
    // Traduzir role para português
    const tipoMap = {
        'funcionario': 'Funcionário',
        'estudante': 'Estudante',
        'professor': 'Professor'
    };
    const tipoFormatado = tipoMap[reader.role] || reader.role;
    
    row.innerHTML = `
        <td>${reader.nome}</td>
        <td>${reader.cpf}</td>
        <td>${reader.email}</td>
        <td>${reader.matricula}</td>
        <td>${tipoFormatado}</td>
    `;
    
    row.addEventListener('click', function() {
        showReaderDetails(reader);
    });

    tableBody.appendChild(row);
}

function showReaderDetails(reader) {
    // Traduzir role para português
    const tipoMap = {
        'funcionario': 'Funcionário',
        'estudante': 'Estudante',
        'professor': 'Professor'
    };
    const tipoFormatado = tipoMap[reader.role] || reader.role;
    
    document.getElementById('detail-name').textContent = reader.nome;
    document.getElementById('detail-cpf').textContent = reader.cpf;
    document.getElementById('detail-email').textContent = reader.email;
    document.getElementById('detail-matricula').textContent = reader.matricula;
    document.getElementById('detail-tipo').textContent = tipoFormatado;
    
    // Popula a tabela de empréstimos
    const borrowedTableBody = document.querySelector('#readerDetailsModal .borrowed-table tbody');
    borrowedTableBody.innerHTML = '';
    
    if (reader.emprestimos && reader.emprestimos.length > 0) {
        reader.emprestimos.forEach(emprestimo => {
            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            
            row.innerHTML = `
                <td>${emprestimo.titulo}</td>
                <td>${emprestimo.isbn}</td>
                <td>${emprestimo.dataEmprestimo}</td>
                <td>${emprestimo.dataDevolucao}</td>
                <td>${emprestimo.status}</td>
            `;
            
            row.addEventListener('click', function() {
                showBookDetails(emprestimo);
            });
            
            borrowedTableBody.appendChild(row);
        });
    } else {
        borrowedTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">Nenhum empréstimo ativo</td></tr>';
    }
    
    openModal(readerModal);
}

function showBookDetails(emprestimo) {
    document.getElementById('detail-title').textContent = emprestimo.titulo || '';
    document.getElementById('detail-author').textContent = emprestimo.autor || '';
    document.getElementById('detail-publisher').textContent = emprestimo.editora || '';
    document.getElementById('detail-edition').textContent = emprestimo.edicao || '';
    document.getElementById('detail-isbn').textContent = emprestimo.isbn || '';
    document.getElementById('detail-categories').textContent = emprestimo.categorias || '';
    document.getElementById('detail-year').textContent = emprestimo.ano || '';
    document.getElementById('detail-location').textContent = emprestimo.localizacao || '';
    document.getElementById('detail-copie').textContent = emprestimo.exemplar || '';
    document.getElementById('detail-borrow-date').textContent = emprestimo.dataEmprestimo || '';
    document.getElementById('detail-return-date').textContent = emprestimo.dataDevolucao || '';
    document.getElementById('detail-total-payable').textContent = emprestimo.totalAPagar || 'R$ 0,00';
    
    openModal(bookModal);
}

async function deleteReader() {
    // Obter CPF do leitor a partir do modal
    const cpf = document.getElementById('detail-cpf').textContent;
    
    if (!cpf) {
        alert('Erro: CPF do leitor não encontrado.');
        return;
    }
    
    if (!confirm('Tem certeza que deseja excluir este leitor?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/usuarios/${cpf}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Fechar modal
            closeModal(readerModal);
            
            // Recarregar lista de leitores
            await carregarLeitores();
            
            alert('Usuário excluído com sucesso!');
        } else {
            alert(result.message || 'Erro ao excluir usuário.');
        }
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        alert('Erro ao conectar com o servidor.');
    }
}

function registerReturn () {
    // Função para registrar devolução de livro (a ser implementada)
}

function removeDebit() {
    // Função para retirar débito (a ser implementada)
}