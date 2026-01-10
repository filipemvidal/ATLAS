from flask import Blueprint, request, jsonify, session
import json
import os
from datetime import datetime, timedelta

bp = Blueprint('emprestimos', __name__, url_prefix='/api/emprestimos')

# Caminhos para os arquivos
USUARIOS_FILE = os.path.join('data', 'usuarios.json')
LIVROS_FILE = os.path.join('data', 'livros.json')

# Constantes
DIAS_EMPRESTIMO = 14
VALOR_MULTA_DIA = 1.0
MAX_LIVROS_EMPRESTADOS = 3
MAX_DEBITO = 10.0

def carregar_usuarios():
    """Carrega usuários do arquivo JSON"""
    if os.path.exists(USUARIOS_FILE):
        with open(USUARIOS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def salvar_usuarios(usuarios):
    """Salva usuários no arquivo JSON"""
    with open(USUARIOS_FILE, 'w', encoding='utf-8') as f:
        json.dump(usuarios, f, ensure_ascii=False, indent=2)

def carregar_livros():
    """Carrega livros do arquivo JSON"""
    if os.path.exists(LIVROS_FILE):
        with open(LIVROS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def salvar_livros(livros):
    """Salva livros no arquivo JSON"""
    with open(LIVROS_FILE, 'w', encoding='utf-8') as f:
        json.dump(livros, f, ensure_ascii=False, indent=2)

def calcular_debito_emprestimo(data_emprestimo_str, data_devolucao_prevista_str):
    """Calcula o débito de um empréstimo baseado na data atual"""
    try:
        data_devolucao_prevista = datetime.strptime(data_devolucao_prevista_str, '%Y-%m-%d')
        data_atual = datetime.now()
        
        # Se ainda não passou da data de devolução, débito é 0
        if data_atual <= data_devolucao_prevista:
            return 0.0
        
        # Calcular dias de atraso
        dias_atraso = (data_atual - data_devolucao_prevista).days
        debito = dias_atraso * VALOR_MULTA_DIA
        
        return debito
    except:
        return 0.0

def calcular_debito_total(emprestimos):
    """Calcula o débito total de todos os empréstimos de um leitor"""
    debito_total = 0.0
    
    for emprestimo in emprestimos:
        debito = calcular_debito_emprestimo(
            emprestimo.get('data_emprestimo'),
            emprestimo.get('data_devolucao_prevista')
        )
        debito_total += debito
    
    return debito_total

@bp.route('/emprestar', methods=['POST'])
def emprestar_livro():
    """Empresta um livro para um leitor (funcionário empresta para leitor via CPF)"""
    # Verificar autenticação
    if 'usuario_logado' not in session:
        return jsonify({'success': False, 'message': 'Não autenticado'}), 401
    
    usuario_logado = session['usuario_logado']
    
    # Verificar se é funcionário
    if usuario_logado.get('role') != 'funcionario':
        return jsonify({'success': False, 'message': 'Apenas funcionários podem realizar empréstimos'}), 403
    
    data = request.get_json()
    cpf_leitor = data.get('cpf_leitor')
    livro_id = data.get('livro_id')
    
    if not cpf_leitor or not livro_id:
        return jsonify({'success': False, 'message': 'CPF do leitor e ID do livro são obrigatórios'}), 400
    
    # Carregar dados
    usuarios = carregar_usuarios()
    livros = carregar_livros()
    
    # Encontrar o leitor
    leitor = None
    leitor_index = None
    for i, usuario in enumerate(usuarios):
        if usuario.get('cpf') == cpf_leitor:
            leitor = usuario
            leitor_index = i
            break
    
    if not leitor:
        return jsonify({'success': False, 'message': 'Leitor não encontrado'}), 404
    
    # RESTRIÇÃO 3: Funcionários não podem pegar livros emprestados
    if leitor.get('role') == 'funcionario':
        return jsonify({'success': False, 'message': 'Funcionários não podem pegar livros emprestados'}), 400
    
    # Encontrar o livro
    livro = None
    livro_index = None
    for i, l in enumerate(livros):
        if l.get('id') == livro_id:
            livro = l
            livro_index = i
            break
    
    if not livro:
        return jsonify({'success': False, 'message': 'Livro não encontrado'}), 404
    
    # Verificar disponibilidade
    exemplares_disponiveis = livro.get('exemplares_totais', 0) - livro.get('exemplares_emprestados', 0)
    if exemplares_disponiveis <= 0:
        return jsonify({'success': False, 'message': 'Não há exemplares disponíveis para empréstimo'}), 400
    
    # Inicializar empréstimos se não existir
    if 'emprestimos' not in leitor:
        leitor['emprestimos'] = []
    
    # RESTRIÇÃO 1: Máximo de 3 livros emprestados
    if len(leitor['emprestimos']) >= MAX_LIVROS_EMPRESTADOS:
        return jsonify({'success': False, 'message': f'O leitor já possui {MAX_LIVROS_EMPRESTADOS} livros emprestados. Limite máximo atingido.'}), 400
    
    # RESTRIÇÃO 2: Débito não pode superar R$ 10,00
    debito_atual = calcular_debito_total(leitor['emprestimos'])
    if debito_atual >= MAX_DEBITO:
        return jsonify({'success': False, 'message': f'O leitor possui débito de R$ {debito_atual:.2f}. O débito não pode superar R$ {MAX_DEBITO:.2f} para novos empréstimos.'}), 400
    
    # Verificar se o leitor já tem este livro emprestado
    for emp in leitor['emprestimos']:
        if emp.get('livro_id') == livro_id:
            return jsonify({'success': False, 'message': 'Este leitor já possui um exemplar deste livro emprestado'}), 400
    
    # Calcular datas
    data_emprestimo = datetime.now()
    data_devolucao_prevista = data_emprestimo + timedelta(days=DIAS_EMPRESTIMO)
    
    # Criar objeto de empréstimo
    emprestimo = {
        'livro_id': livro_id,
        'data_emprestimo': data_emprestimo.strftime('%Y-%m-%d'),
        'data_devolucao_prevista': data_devolucao_prevista.strftime('%Y-%m-%d')
    }
    
    # Realizar empréstimo
    leitor['emprestimos'].append(emprestimo)
    livros[livro_index]['exemplares_emprestados'] = livro.get('exemplares_emprestados', 0) + 1
    
    # Salvar alterações
    usuarios[leitor_index] = leitor
    salvar_usuarios(usuarios)
    salvar_livros(livros)
    
    return jsonify({
        'success': True, 
        'message': 'Empréstimo realizado com sucesso',
        'leitor': leitor.get('nome'),
        'livro': livro.get('titulo'),
        'data_devolucao': data_devolucao_prevista.strftime('%d/%m/%Y')
    })

@bp.route('/emprestar-direto', methods=['POST'])
def emprestar_direto():
    """Leitor empresta um livro diretamente (quando há exemplares disponíveis)"""
    # Verificar autenticação
    if 'usuario_logado' not in session:
        return jsonify({'success': False, 'message': 'Não autenticado'}), 401
    
    usuario_logado = session['usuario_logado']
    cpf_leitor = usuario_logado.get('cpf')
    
    # RESTRIÇÃO 3: Funcionários não podem pegar livros emprestados
    if usuario_logado.get('role') == 'funcionario':
        return jsonify({'success': False, 'message': 'Funcionários não podem pegar livros emprestados'}), 403
    
    data = request.get_json()
    livro_id = data.get('livro_id')
    
    if not livro_id:
        return jsonify({'success': False, 'message': 'ID do livro é obrigatório'}), 400
    
    # Carregar dados
    usuarios = carregar_usuarios()
    livros = carregar_livros()
    
    # Encontrar o leitor
    leitor = None
    leitor_index = None
    for i, usuario in enumerate(usuarios):
        if usuario.get('cpf') == cpf_leitor:
            leitor = usuario
            leitor_index = i
            break
    
    if not leitor:
        return jsonify({'success': False, 'message': 'Leitor não encontrado'}), 404
    
    # Encontrar o livro
    livro = None
    livro_index = None
    for i, l in enumerate(livros):
        if l.get('id') == livro_id:
            livro = l
            livro_index = i
            break
    
    if not livro:
        return jsonify({'success': False, 'message': 'Livro não encontrado'}), 404
    
    # Verificar disponibilidade - SÓ PODE EMPRESTAR SE HOUVER EXEMPLARES DISPONÍVEIS
    exemplares_disponiveis = livro.get('exemplares_totais', 0) - livro.get('exemplares_emprestados', 0)
    if exemplares_disponiveis <= 0:
        return jsonify({
            'success': False, 
            'message': 'Não há exemplares disponíveis. Você pode fazer uma reserva.'
        }), 400
    
    # Inicializar empréstimos se não existir
    if 'emprestimos' not in leitor:
        leitor['emprestimos'] = []
    
    # RESTRIÇÃO 1: Máximo de 3 livros emprestados
    if len(leitor['emprestimos']) >= MAX_LIVROS_EMPRESTADOS:
        return jsonify({'success': False, 'message': f'Você já possui {MAX_LIVROS_EMPRESTADOS} livros emprestados. Limite máximo atingido.'}), 400
    
    # RESTRIÇÃO 2: Débito não pode superar R$ 10,00
    debito_atual = calcular_debito_total(leitor['emprestimos'])
    if debito_atual >= MAX_DEBITO:
        return jsonify({'success': False, 'message': f'Você possui débito de R$ {debito_atual:.2f}. O débito não pode superar R$ {MAX_DEBITO:.2f} para novos empréstimos.'}), 400
    
    # Verificar se o leitor já tem este livro emprestado
    for emp in leitor['emprestimos']:
        if emp.get('livro_id') == livro_id:
            return jsonify({'success': False, 'message': 'Você já possui um exemplar deste livro emprestado'}), 400
    
    # Calcular datas
    data_emprestimo = datetime.now()
    data_devolucao_prevista = data_emprestimo + timedelta(days=DIAS_EMPRESTIMO)
    
    # Criar objeto de empréstimo
    emprestimo = {
        'livro_id': livro_id,
        'data_emprestimo': data_emprestimo.strftime('%Y-%m-%d'),
        'data_devolucao_prevista': data_devolucao_prevista.strftime('%Y-%m-%d')
    }
    
    # Realizar empréstimo
    leitor['emprestimos'].append(emprestimo)
    livros[livro_index]['exemplares_emprestados'] = livro.get('exemplares_emprestados', 0) + 1
    
    # Salvar alterações
    usuarios[leitor_index] = leitor
    salvar_usuarios(usuarios)
    salvar_livros(livros)
    
    return jsonify({
        'success': True, 
        'message': 'Empréstimo realizado com sucesso',
        'livro': livro.get('titulo'),
        'data_devolucao': data_devolucao_prevista.strftime('%d/%m/%Y')
    })

@bp.route('/reservar', methods=['POST'])
def reservar_livro():
    """Leitor reserva um livro (apenas quando não há exemplares disponíveis)"""
    # Verificar autenticação
    if 'usuario_logado' not in session:
        return jsonify({'success': False, 'message': 'Não autenticado'}), 401
    
    usuario_logado = session['usuario_logado']
    cpf_leitor = usuario_logado.get('cpf')
    
    # RESTRIÇÃO 3: Funcionários não podem pegar livros emprestados
    if usuario_logado.get('role') == 'funcionario':
        return jsonify({'success': False, 'message': 'Funcionários não podem reservar livros'}), 403
    
    data = request.get_json()
    livro_id = data.get('livro_id')
    
    if not livro_id:
        return jsonify({'success': False, 'message': 'ID do livro é obrigatório'}), 400
    
    # Carregar dados
    usuarios = carregar_usuarios()
    livros = carregar_livros()
    
    # Encontrar o leitor
    leitor = None
    leitor_index = None
    for i, usuario in enumerate(usuarios):
        if usuario.get('cpf') == cpf_leitor:
            leitor = usuario
            leitor_index = i
            break
    
    if not leitor:
        return jsonify({'success': False, 'message': 'Leitor não encontrado'}), 404
    
    # Encontrar o livro
    livro = None
    livro_index = None
    for i, l in enumerate(livros):
        if l.get('id') == livro_id:
            livro = l
            livro_index = i
            break
    
    if not livro:
        return jsonify({'success': False, 'message': 'Livro não encontrado'}), 404
    
    # Verificar disponibilidade - SÓ PODE RESERVAR SE NÃO HOUVER EXEMPLARES DISPONÍVEIS
    exemplares_disponiveis = livro.get('exemplares_totais', 0) - livro.get('exemplares_emprestados', 0)
    if exemplares_disponiveis > 0:
        return jsonify({
            'success': False, 
            'message': 'Há exemplares disponíveis. Você pode emprestar o livro diretamente ao invés de reservar.'
        }), 400
    
    # Inicializar fila de reservas se não existir
    if 'fila_reservas' not in livro:
        livro['fila_reservas'] = []
    
    # Verificar se o leitor já tem este livro reservado
    for reserva in livro['fila_reservas']:
        if reserva.get('cpf_leitor') == cpf_leitor:
            return jsonify({'success': False, 'message': 'Você já possui uma reserva para este livro'}), 400
    
    # Verificar se o leitor já tem este livro emprestado
    if 'emprestimos' not in leitor:
        leitor['emprestimos'] = []
    
    for emp in leitor['emprestimos']:
        if emp.get('livro_id') == livro_id:
            return jsonify({'success': False, 'message': 'Você já possui um exemplar deste livro emprestado'}), 400
    
    # Criar reserva
    data_reserva = datetime.now()
    reserva = {
        'cpf_leitor': cpf_leitor,
        'nome_leitor': leitor.get('nome'),
        'data_reserva': data_reserva.strftime('%Y-%m-%d')
    }
    
    # Adicionar à fila de reservas do livro
    livro['fila_reservas'].append(reserva)
    livros[livro_index] = livro
    
    # Adicionar ID do livro à lista de reservas do usuário
    if 'reservas' not in leitor:
        leitor['reservas'] = []
    
    if livro_id not in leitor['reservas']:
        leitor['reservas'].append(livro_id)
    
    # Salvar alterações
    usuarios[leitor_index] = leitor
    salvar_usuarios(usuarios)
    salvar_livros(livros)
    
    # Calcular posição na fila
    posicao_fila = len(livro['fila_reservas'])
    
    return jsonify({
        'success': True, 
        'message': 'Reserva realizada com sucesso',
        'livro': livro.get('titulo'),
        'posicao_fila': posicao_fila
    })

@bp.route('/debito/<string:cpf>', methods=['GET'])
def consultar_debito(cpf):
    """Consulta o débito total de um leitor"""
    usuarios = carregar_usuarios()
    
    # Encontrar o leitor
    leitor = None
    for usuario in usuarios:
        if usuario.get('cpf') == cpf:
            leitor = usuario
            break
    
    if not leitor:
        return jsonify({'success': False, 'message': 'Leitor não encontrado'}), 404
    
    emprestimos = leitor.get('emprestimos', [])
    debito_total = calcular_debito_total(emprestimos)
    
    # Calcular débito por empréstimo
    emprestimos_com_debito = []
    for emp in emprestimos:
        debito = calcular_debito_emprestimo(
            emp.get('data_emprestimo'),
            emp.get('data_devolucao_prevista')
        )
        emprestimos_com_debito.append({
            'livro_id': emp.get('livro_id'),
            'data_emprestimo': emp.get('data_emprestimo'),
            'data_devolucao_prevista': emp.get('data_devolucao_prevista'),
            'debito': debito
        })
    
    return jsonify({
        'success': True,
        'leitor': leitor.get('nome'),
        'cpf': cpf,
        'debito_total': debito_total,
        'emprestimos': emprestimos_com_debito
    })
