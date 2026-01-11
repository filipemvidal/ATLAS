const readerModal = document.getElementById('readerDetailsModal');
const bookModal = document.getElementById('bookDetailsModal');

let readersData = [];
let booksData = [];
let currentBorrowData = null; // Armazena dados do empréstimo atual para devolução

// Carregar leitores e livros ao inicializar a página
window.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        carregarLeitores(),
        carregarLivros()
    ]);
});

async function carregarLivros() {
    try {
        const response = await fetch('/api/books/');
        
        if (response.ok) {
            booksData = await response.json();
        } else {
            console.error('Erro ao carregar livros');
        }
    } catch (error) {
        console.error('Erro ao conectar com o servidor:', error);
    }
}

async function carregarLeitores() {
    try {
        const response = await fetch('/api/usuarios');
        
        if (response.ok) {
            const result = await response.json();
            
            if (result.success) {
                readersData = result.usuarios;
                
                // Limpar tabela
                const tableBody = document.getElementById('readersTableBody');
                tableBody.innerHTML = '';
                
                // Adicionar cada leitor na tabela
                readersData.forEach(reader => {
                    addReaderRow(reader);
                });
            }
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
    if (confirm('Deseja realmente sair?')) {
        window.location.href = '/api/logout';
    }
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
    
    // Formatar tipo de usuário
    const tipoMap = {
        'funcionario': 'Funcionário',
        'leitor': 'Leitor'
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
    // Formatar tipo de usuário
    const tipoMap = {
        'funcionario': 'Funcionário',
        'leitor': 'Leitor'
    };
    const tipoFormatado = tipoMap[reader.role] || reader.role;
    
    document.getElementById('detail-name').textContent = reader.nome;
    document.getElementById('detail-cpf').textContent = reader.cpf;
    document.getElementById('detail-email').textContent = reader.email;
    document.getElementById('detail-matricula').textContent = reader.matricula;
    document.getElementById('detail-tipo').textContent = tipoFormatado;
    
    // Atualizar tabela de empréstimos usando função reutilizável
    atualizarTabelaEmprestimos(reader.cpf);
    
    openModal(readerModal);
}

function formatarData(dataStr) {
    if (!dataStr) return '-';
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
}

function atualizarTabelaEmprestimos(cpf_leitor) {
    // Buscar leitor atualizado
    const leitor = readersData.find(l => l.cpf === cpf_leitor);
    if (!leitor) return;
    
    // Atualizar apenas a tabela de empréstimos
    const borrowedTableBody = document.querySelector('#readerDetailsModal .borrowed-table tbody');
    borrowedTableBody.innerHTML = '';
    
    // Filtrar empréstimos ativos, em atraso e devolvidos com débito (não finalizados)
    const emprestimosAtivos = leitor.emprestimos ? leitor.emprestimos.filter(emp => emp.status === 'ativo' || emp.status === 'em atraso' || emp.status === 'devolvido-em-atraso') : [];
    
    if (emprestimosAtivos.length > 0) {
        emprestimosAtivos.forEach(emprestimo => {
            // Buscar dados do livro pelo ID
            const livro = booksData.find(l => l.id === emprestimo.livro_id);
            
            if (!livro) {
                console.error('Livro não encontrado:', emprestimo.livro_id);
                return;
            }
            
            // Formatar datas
            const dataEmprestimoFormatada = formatarData(emprestimo.data_emprestimo);
            const dataDevolucaoFormatada = formatarData(emprestimo.data_devolucao_prevista);
            
            // Determinar status baseado no status do empréstimo ou calcular
            let status, statusColor;
            if (emprestimo.status === 'devolvido-em-atraso') {
                status = 'Devolvido (Débito pendente)';
                statusColor = 'orange';
            } else if (emprestimo.status === 'em atraso') {
                status = 'Em atraso';
                statusColor = 'red';
            } else {
                const dataAtual = new Date();
                const dataDevolucao = new Date(emprestimo.data_devolucao_prevista);
                status = dataAtual <= dataDevolucao ? 'Em dia' : 'Em atraso';
                statusColor = status === 'Em atraso' ? 'red' : 'green';
            }
            
            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            
            row.innerHTML = `
                <td>${livro.titulo}</td>
                <td>${livro.isbn || '-'}</td>
                <td>${dataEmprestimoFormatada}</td>
                <td>${dataDevolucaoFormatada}</td>
                <td style="color: ${statusColor}; font-weight: ${emprestimo.status === 'em atraso' || emprestimo.status === 'devolvido-em-atraso' ? 'bold' : 'normal'}">${status}</td>
            `;
            
            row.addEventListener('click', function() {
                showBookDetailsFromReader(livro, emprestimo, leitor.cpf);
            });
            
            borrowedTableBody.appendChild(row);
        });
    } else {
        borrowedTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">Nenhum empréstimo ativo</td></tr>';
    }
}

function showBookDetailsFromReader(livro, emprestimo, leitorCpf) {
    document.getElementById('detail-title').textContent = livro.titulo || '';
    document.getElementById('detail-author').textContent = livro.autor || '';
    document.getElementById('detail-publisher').textContent = livro.editora || '';
    document.getElementById('detail-edition').textContent = livro.edicao || '';
    document.getElementById('detail-isbn').textContent = livro.isbn || '';
    document.getElementById('detail-categories').textContent = Array.isArray(livro.categorias) 
        ? livro.categorias.join(', ') 
        : livro.categorias || '';
    document.getElementById('detail-year').textContent = livro.ano || '';
    document.getElementById('detail-location').textContent = livro.localizacao || '';
    
    // Dados do empréstimo
    document.getElementById('detail-borrow-date').textContent = formatarData(emprestimo.data_emprestimo);
    document.getElementById('detail-return-date').textContent = formatarData(emprestimo.data_devolucao_prevista);
    
    // Calcular débito
    const dataAtual = new Date();
    const dataDevolucao = new Date(emprestimo.data_devolucao_prevista);
    let debito = 0;
    if (dataAtual > dataDevolucao) {
        const diasAtraso = Math.floor((dataAtual - dataDevolucao) / (1000 * 60 * 60 * 24));
        debito = diasAtraso * 1.0; // R$ 1,00 por dia
    }
    
    // Se o empréstimo foi devolvido, usar o débito armazenado
    if (emprestimo.data_devolucao_real && emprestimo.debito_pago !== undefined) {
        debito = emprestimo.debito_pago;
    }
    
    document.getElementById('detail-total-payable').textContent = `R$ ${debito.toFixed(2)}`;
    
    // Armazenar dados para devolução
    currentBorrowData = {
        cpf_leitor: leitorCpf,
        livro_id: livro.id,
        livro_titulo: livro.titulo,
        debito: debito,
        ja_devolvido: emprestimo.data_devolucao_real ? true : false
    };
    
    // Controlar visibilidade dos botões baseado no status do empréstimo
    const btnRegisterReturn = document.querySelector('.book-details-btns button[onclick="registerReturn()"]');
    const btnRemoveDebit = document.querySelector('.book-details-btns button[onclick="removeDebit()"]');
    const btnRenewBorrow = document.querySelector('.book-details-btns button[onclick="renewBorrow()"]');
    
    if (emprestimo.status === 'devolvido-em-atraso') {
        // Devolvido com débito: mostrar apenas botão de retirar débito
        if (btnRegisterReturn) btnRegisterReturn.style.display = 'none';
        if (btnRemoveDebit) btnRemoveDebit.style.display = 'inline-flex';
        if (btnRenewBorrow) btnRenewBorrow.style.display = 'none';
    } else if (emprestimo.status === 'em atraso') {
        // Em atraso: mostrar os 3 botões
        if (btnRegisterReturn) btnRegisterReturn.style.display = 'inline-flex';
        if (btnRemoveDebit) btnRemoveDebit.style.display = 'none';
        if (btnRenewBorrow) btnRenewBorrow.style.display = 'none';
    } else if (emprestimo.status === 'ativo') {
        // Ativo e dentro do prazo: mostrar apenas devolução e renovação
        if (btnRegisterReturn) btnRegisterReturn.style.display = 'inline-flex';
        if (btnRemoveDebit) btnRemoveDebit.style.display = 'none';
        if (btnRenewBorrow) btnRenewBorrow.style.display = 'inline-flex';
    }
    
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

async function registerReturn() {
    if (!currentBorrowData) {
        alert('Erro: Dados do empréstimo não encontrados.');
        return;
    }
    
    const { cpf_leitor, livro_id, livro_titulo, debito, ja_devolvido } = currentBorrowData;
    
    // Se já foi devolvido, não permite registrar devolução novamente
    if (ja_devolvido) {
        alert('Este livro já foi devolvido!\n\nO empréstimo permanece com status "Devolvido (Débito pendente)" porque há débito de R$ ' + debito.toFixed(2) + '.\nUtilize o botão "Retirar débito" para quitar o débito e finalizar o empréstimo.');
        return;
    }
    
    // Confirmar devolução
    let mensagem = `Registrar devolução do livro "${livro_titulo}"?`;
    if (debito > 0) {
        mensagem += `\n\nAtenção: Há um débito de R$ ${debito.toFixed(2)} pendente.\nO empréstimo ficará com status "Devolvido (Débito pendente)" até o débito ser quitado.`;
    }
    
    if (!confirm(mensagem)) {
        return;
    }
    
    try {
        const response = await fetch('/api/emprestimos/devolver', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cpf_leitor: cpf_leitor,
                livro_id: livro_id
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Recarregar leitores
            await carregarLeitores();
            
            // Atualizar tabela de empréstimos do leitor em tempo real
            atualizarTabelaEmprestimos(cpf_leitor);
            
            // Preparar mensagem com empréstimo automático (se houver)
            let mensagemSucesso = result.message;
            if (result.emprestimo_automatico) {
                mensagemSucesso += `\n\nO livro foi automaticamente emprestado para ${result.emprestimo_automatico.leitor} (CPF: ${result.emprestimo_automatico.cpf}) que estava na fila de reservas.`;
            }
            
            // Verificar se há débito pendente
            const temDebito = result.debito && result.debito > 0;
            
            if (temDebito) {
                // Se houver débito, atualizar o modal do livro
                const leitor = readersData.find(l => l.cpf === cpf_leitor);
                if (leitor) {
                    const emprestimo = leitor.emprestimos.find(e => e.livro_id === livro_id);
                    const livro = booksData.find(l => l.id === livro_id);
                    
                    if (emprestimo && livro) {
                        // Atualizar detalhes do modal do livro
                        showBookDetailsFromReader(livro, emprestimo, cpf_leitor);
                    }
                }
                
                // Adicionar informação do débito à mensagem
                mensagemSucesso += `\n\nDébito pendente: R$ ${result.debito.toFixed(2)}\n\nO empréstimo ficará com status "Devolvido (Débito pendente)" até o débito ser quitado.`;
                alert(mensagemSucesso);
            } else {
                // Se não houver débito, fechar modal do livro e limpar dados
                closeModal(bookModal);
                alert(mensagemSucesso);
                currentBorrowData = null;
            }
        } else {
            alert(result.message || 'Erro ao registrar devolução.');
        }
    } catch (error) {
        console.error('Erro ao registrar devolução:', error);
        alert('Erro ao conectar com o servidor.');
    }
}

async function removeDebit() {
    if (!currentBorrowData) {
        alert('Erro: Dados do empréstimo não encontrados.');
        return;
    }
    
    const { cpf_leitor, livro_id, livro_titulo, debito } = currentBorrowData;
    
    if (debito <= 0) {
        alert('Não há débito pendente para este empréstimo.');
        return;
    }
    
    // Confirmar pagamento do débito
    if (!confirm(`Registrar pagamento do débito do livro "${livro_titulo}"?\n\nValor: R$ ${debito.toFixed(2)}`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/emprestimos/retirar-debito', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cpf_leitor: cpf_leitor,
                livro_id: livro_id
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Recarregar leitores
            await carregarLeitores();
            
            // Atualizar tabela de empréstimos do leitor em tempo real
            atualizarTabelaEmprestimos(cpf_leitor);
            
            // Fechar modal do livro
            closeModal(bookModal);
            
            alert(`${result.message}\n\nValor pago: R$ ${result.valor_pago.toFixed(2)}`);
            
            // Limpar dados
            currentBorrowData = null;
        } else {
            alert(result.message || 'Erro ao registrar pagamento do débito.');
        }
    } catch (error) {
        console.error('Erro ao registrar pagamento:', error);
        alert('Erro ao conectar com o servidor.');
    }
}

async function renewBorrow() {
    if (!currentBorrowData) {
        alert('Erro: Dados do empréstimo não encontrados.');
        return;
    }
    
    const { cpf_leitor, livro_id, livro_titulo, debito } = currentBorrowData;
    
    // Verificar se há débito pendente
    if (debito > 0) {
        alert(`Não é possível renovar o empréstimo!\n\nHá um débito de R$ ${debito.toFixed(2)} pendente.\n\nPor favor, quite o débito antes de renovar o empréstimo.`);
        return;
    }
    
    // Confirmar renovação
    if (!confirm(`Renovar empréstimo do livro "${livro_titulo}"?\n\nO prazo de devolução será estendido por mais 14 dias.\n\nObs: A renovação só pode ser feita até 5 dias antes da data de devolução.`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/emprestimos/renovar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cpf_leitor: cpf_leitor,
                livro_id: livro_id
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Recarregar leitores
            await carregarLeitores();
            
            // Atualizar tabela de empréstimos do leitor em tempo real
            atualizarTabelaEmprestimos(cpf_leitor);
            
            // Fechar modal do livro
            closeModal(bookModal);
            
            alert(`${result.message}\n\nNova data de devolução: ${result.nova_data_devolucao}`);
            
            // Limpar dados
            currentBorrowData = null;
        } else {
            alert(result.message || 'Erro ao renovar empréstimo.');
        }
    } catch (error) {
        console.error('Erro ao renovar empréstimo:', error);
        alert('Erro ao conectar com o servidor.');
    }
}