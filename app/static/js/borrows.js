// Carregar dados do usuário logado
const usuarioLogado = JSON.parse(document.getElementById('usuario-data').textContent);

let booksData = [];
let emprestimosAtivos = [];
let emprestimosHistorico = [];
let reservas = [];

// Carregar dados quando a página é carregada
carregarDados();

async function carregarDados() {
    await carregarLivros();
    await carregarEmprestimos();
    await carregarReservas();
    atualizarResumo();
}

async function carregarLivros() {
    try {
        const response = await fetch('/api/books/');
        const result = await response.json();
        if (Array.isArray(result)) {
            booksData = result;
        }
    } catch (error) {
        console.error('Erro ao carregar livros:', error);
    }
}

async function carregarEmprestimos() {
    try {
        const response = await fetch('/api/usuarios');
        const result = await response.json();
        
        if (result.success) {
            const usuario = result.usuarios.find(u => u.cpf === usuarioLogado.cpf);
            if (usuario && usuario.emprestimos) {
                // Separar empréstimos ativos e histórico
                emprestimosAtivos = usuario.emprestimos.filter(e => 
                    e.status === 'ativo' || e.status === 'em atraso' || e.status === 'devolvido-em-atraso'
                );
                emprestimosHistorico = usuario.emprestimos.filter(e => 
                    e.status === 'devolvido'
                );
                
                renderizarEmprestimosAtivos();
                renderizarHistorico();
            }
        }
    } catch (error) {
        console.error('Erro ao carregar empréstimos:', error);
        document.getElementById('borrowsTableBody').innerHTML = 
            '<tr><td colspan="7" class="empty-message">Erro ao carregar empréstimos</td></tr>';
    }
}

async function carregarReservas() {
    try {
        const response = await fetch('/api/usuarios');
        const result = await response.json();
        
        if (result.success) {
            const usuario = result.usuarios.find(u => u.cpf === usuarioLogado.cpf);
            if (usuario && usuario.reservas) {
                reservas = usuario.reservas;
                renderizarReservas();
            } else {
                renderizarReservas();
            }
        }
    } catch (error) {
        console.error('Erro ao carregar reservas:', error);
    }
}

function renderizarEmprestimosAtivos() {
    const tbody = document.getElementById('borrowsTableBody');
    
    if (emprestimosAtivos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-message">Você não possui empréstimos ativos no momento</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    emprestimosAtivos.forEach(emprestimo => {
        const livro = booksData.find(l => l.id === emprestimo.livro_id);
        if (!livro) return;
        
        const debito = calcularDebito(emprestimo);
        const statusInfo = getStatusInfo(emprestimo.status, debito);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${livro.titulo}</td>
            <td>${livro.autor}</td>
            <td>${formatarData(emprestimo.data_emprestimo)}</td>
            <td>${formatarData(emprestimo.data_devolucao_prevista)}</td>
            <td><span class="status-badge ${statusInfo.class}">${statusInfo.text}</span></td>
            <td><strong>R$ ${debito.toFixed(2)}</strong></td>
            <td>
                ${emprestimo.status === 'devolvido-em-atraso' ? '' : 
                    `<button class="btn-primary btn-sm" onclick="renovarEmprestimo(${emprestimo.livro_id})">
                        <i class="fa fa-refresh"></i> Renovar
                    </button>`
                }
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderizarHistorico() {
    const tbody = document.getElementById('historyTableBody');
    
    if (emprestimosHistorico.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-message">Nenhum empréstimo no histórico</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    emprestimosHistorico.forEach(emprestimo => {
        const livro = booksData.find(l => l.id === emprestimo.livro_id);
        if (!livro) return;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${livro.titulo}</td>
            <td>${livro.autor}</td>
            <td>${formatarData(emprestimo.data_emprestimo)}</td>
            <td>${formatarData(emprestimo.data_devolucao_prevista)}</td>
            <td>${formatarData(emprestimo.data_devolucao_real)}</td>
            <td><span class="status-badge status-devolvido">Devolvido</span></td>
            <td>R$ ${(emprestimo.debito_pago || 0).toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderizarReservas() {
    const tbody = document.getElementById('reservasTableBody');
    
    if (reservas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-message">Você não possui reservas ativas</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    reservas.forEach((livro_id, index) => {
        const livro = booksData.find(l => l.id === livro_id);
        if (!livro) {
            return;
        }
        
        // Calcular posição na fila e buscar data da reserva
        const reservaInfo = (livro.fila_reservas || []).find(r => r.cpf_leitor === usuarioLogado.cpf);
        const posicao = (livro.fila_reservas || []).findIndex(r => r.cpf_leitor === usuarioLogado.cpf) + 1;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${livro.titulo}</td>
            <td>${livro.autor}</td>
            <td>${reservaInfo ? formatarData(reservaInfo.data_reserva) : '-'}</td>
            <td><span class="position-badge">${posicao}º lugar</span></td>
            <td>
                <button class="btn-danger btn-sm" onclick="cancelarReserva(${livro_id})">
                    <i class="fa fa-times"></i> Cancelar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function atualizarResumo() {
    const ativos = emprestimosAtivos.filter(e => e.status === 'ativo').length;
    const atraso = emprestimosAtivos.filter(e => e.status === 'em atraso').length;
    
    let debitoTotal = 0;
    emprestimosAtivos.forEach(emp => {
        if (emp.status === 'ativo' || emp.status === 'em atraso') {
            debitoTotal += calcularDebito(emp);
        }
    });
    
    document.getElementById('total-ativos').textContent = ativos;
    document.getElementById('total-atraso').textContent = atraso;
    document.getElementById('total-debito').textContent = `R$ ${debitoTotal.toFixed(2)}`;
}

function calcularDebito(emprestimo) {
    if (emprestimo.status === 'devolvido' || emprestimo.status === 'devolvido-em-atraso') {
        return emprestimo.debito_pago || 0;
    }
    
    const dataAtual = new Date();
    const dataDevolucao = new Date(emprestimo.data_devolucao_prevista);
    
    if (dataAtual <= dataDevolucao) {
        return 0;
    }
    
    const diasAtraso = Math.floor((dataAtual - dataDevolucao) / (1000 * 60 * 60 * 24));
    return diasAtraso * 1.0; // R$ 1,00 por dia
}

function getStatusInfo(status, debito) {
    if (status === 'em atraso') {
        return { text: 'Em atraso', class: 'status-atraso' };
    } else if (status === 'devolvido-em-atraso') {
        return { text: 'Débito pendente', class: 'status-debito' };
    } else if (debito > 0) {
        return { text: 'Em atraso', class: 'status-atraso' };
    } else {
        return { text: 'Em dia', class: 'status-ativo' };
    }
}

async function renovarEmprestimo(livro_id) {
    const emprestimo = emprestimosAtivos.find(e => e.livro_id === livro_id);
    if (!emprestimo) return;
    
    const livro = booksData.find(l => l.id === livro_id);
    const debito = calcularDebito(emprestimo);
    
    // Verificar débito
    if (debito > 0) {
        alert(`Não é possível renovar o empréstimo!\n\nHá um débito de R$ ${debito.toFixed(2)} pendente.\n\nPor favor, procure a biblioteca para quitar o débito antes de renovar.`);
        return;
    }
    
    if (!confirm(`Renovar empréstimo do livro "${livro.titulo}"?\n\nO prazo de devolução será estendido por mais 14 dias.\n\nObs: A renovação só pode ser feita até 5 dias antes da data de devolução.`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/emprestimos/renovar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cpf_leitor: usuarioLogado.cpf,
                livro_id: livro_id
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`Empréstimo renovado com sucesso!\n\nNova data de devolução: ${result.nova_data_devolucao}`);
            await carregarEmprestimos();
            atualizarResumo();
        } else {
            alert(result.message || 'Erro ao renovar empréstimo.');
        }
    } catch (error) {
        console.error('Erro ao renovar empréstimo:', error);
        alert('Erro ao conectar com o servidor.');
    }
}

async function cancelarReserva(livro_id) {
    const livro = booksData.find(l => l.id === livro_id);
    
    if (!confirm(`Cancelar reserva do livro "${livro.titulo}"?`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/emprestimos/cancelar-reserva', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cpf_leitor: usuarioLogado.cpf,
                livro_id: livro_id
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`Reserva cancelada com sucesso!`);
            await carregarReservas();
        } else {
            alert(result.message || 'Erro ao cancelar reserva.');
        }
    } catch (error) {
        console.error('Erro ao cancelar reserva:', error);
        alert('Erro ao conectar com o servidor.');
    }
}

function showTab(tabName) {
    // Esconder todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Remover classe active de todos os botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar aba selecionada
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    
    // Adicionar classe active ao botão clicado
    event.target.classList.add('active');
}

function filterTable(query, tableId) {
    query = query.toLowerCase();
    const rows = document.querySelectorAll(`#${tableId} tr`);
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}

function formatarData(dataStr) {
    if (!dataStr) return '-';
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
}

function logout() {
    if (confirm('Deseja realmente sair?')) {
        window.location.href = '/logout';
    }
}