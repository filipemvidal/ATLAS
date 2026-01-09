const readerModal = document.getElementById('readerDetailsModal');
const bookModal = document.getElementById('bookDetailsModal');

// DELETE
const usuarios = [{
        nome: "Alexandre",
        cpf:"12345678909",
        email: "alexandre@gmail.com",
        matricula: "202365001",
        password: "1234",
        role: "Funcionario",
        emprestimos: [
            {
                titulo: "Clean Code",
                isbn: "978-0132350884",
                autor: "Robert C. Martin",
                editora: "Prentice Hall",
                edicao: "1ª",
                categorias: "Programação",
                ano: "2008",
                localizacao: "Estante A3",
                exemplar: "07",
                dataEmprestimo: "11/02/2025",
                dataDevolucao: "17/02/2025",
                status: "Ativo",
                totalAPagar: "R$ 0,00"
            }
        ]
    },{
        nome: "Ana",
        cpf:"76841799003",
        email: "ana@gmail.com",
        matricula: "202365002",
        password: "1234",
        role: "Professor",
        emprestimos: [
            {
                titulo: "Design Patterns",
                isbn: "978-0201633610",
                autor: "Gang of Four",
                editora: "Addison-Wesley",
                edicao: "1ª",
                categorias: "Arquitetura de Software",
                ano: "1994",
                localizacao: "Estante B2",
                exemplar: "03",
                dataEmprestimo: "05/01/2026",
                dataDevolucao: "20/01/2026",
                status: "Em atraso",
                totalAPagar: "R$ 15,00"
            }
        ]
    },{
        nome: "Carlos",
        cpf:"77183381005",
        email: "carlos@gmail.com",
        matricula: "202365003",
        password: "1234",
        role: "Aluno",
        emprestimos: []
    }
];

for (const usuario of usuarios) {
    addReaderRow(usuario);
}
// FIM-DELETE

// TO-DO: Carregar leitores da base de dados

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
    
    row.innerHTML = `
        <td>${reader.nome}</td>
        <td>${reader.cpf}</td>
        <td>${reader.email}</td>
        <td>${reader.matricula}</td>
    `;
    
    row.addEventListener('click', function() {
        showReaderDetails(reader);
    });

    tableBody.appendChild(row);
}

function showReaderDetails(reader) {
    document.getElementById('detail-name').textContent = reader.nome;
    document.getElementById('detail-cpf').textContent = reader.cpf;
    document.getElementById('detail-email').textContent = reader.email;
    document.getElementById('detail-matricula').textContent = reader.matricula;
    
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

function deleteReader() {
    // Função para deletar leitor (a ser implementada)
}

function registerReturn () {
    // Função para registrar devolução de livro (a ser implementada)
}

function removeDebit() {
    // Função para retirar débito (a ser implementada)
}