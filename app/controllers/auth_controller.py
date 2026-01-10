from flask import Blueprint, request, jsonify, session
import json
import os

bp = Blueprint('auth', __name__, url_prefix='/api')

# Caminho para o arquivo de usuários
USUARIOS_FILE = os.path.join('data', 'usuarios.json')

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

@bp.route('/login', methods=['POST'])
def login():
    """Endpoint para autenticar usuário"""
    data = request.get_json()
    cpf = data.get('cpf')
    senha = data.get('senha')
    
    # Validação básica
    if not cpf or not senha:
        return jsonify({'success': False, 'message': 'CPF e senha são obrigatórios'}), 400
    
    # Carregar usuários
    usuarios = carregar_usuarios()
    
    # Buscar usuário pelo CPF e senha
    usuario_encontrado = None
    for usuario in usuarios:
        if usuario.get('cpf') == cpf and usuario.get('senha') == senha:
            usuario_encontrado = usuario
            break
    
    if usuario_encontrado:
        # Salvar na sessão do Flask
        session['usuario_logado'] = {
            'nome': usuario_encontrado.get('nome'),
            'cpf': usuario_encontrado.get('cpf'),
            'email': usuario_encontrado.get('email'),
            'matricula': usuario_encontrado.get('matricula'),
            'role': usuario_encontrado.get('role')
        }
        
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'message': 'CPF ou senha incorretos'}), 401

@bp.route('/register', methods=['POST'])
def register():
    """Endpoint para cadastrar novo usuário"""
    data = request.get_json()
    
    # Extrair dados
    nome = data.get('nome')
    cpf = data.get('cpf')
    email = data.get('email')
    matricula = data.get('matricula')
    senha = data.get('senha')
    role = data.get('role').lower()
    
    # Validação básica
    if not all([nome, cpf, email, matricula, senha, role]):
        return jsonify({'success': False, 'message': 'Todos os campos são obrigatórios'}), 400
    
    # Validar role
    if role not in ['funcionario', 'estudante', 'professor']:
        return jsonify({'success': False, 'message': 'Tipo de usuário inválido'}), 400
    
    # Carregar usuários existentes
    usuarios = carregar_usuarios()
    
    # Verificar se CPF já existe
    for usuario in usuarios:
        if usuario.get('cpf') == cpf:
            return jsonify({'success': False, 'message': 'CPF já cadastrado'}), 400
        if usuario.get('matricula') == matricula:
            return jsonify({'success': False, 'message': 'Matrícula já cadastrada'}), 400
    
    # Criar novo usuário
    novo_usuario = {
        'nome': nome,
        'cpf': cpf,
        'email': email,
        'matricula': matricula,
        'senha': senha,
        'role': role,
        'reservas': [],
        'emprestimos': []
    }
    
    # Adicionar à lista e salvar
    usuarios.append(novo_usuario)
    salvar_usuarios(usuarios)
    
    return jsonify({'success': True, 'message': 'Usuário cadastrado com sucesso'})

@bp.route('/usuario')
def get_usuario():
    """Retorna dados do usuário logado"""
    if 'usuario_logado' in session:
        return jsonify(session['usuario_logado'])
    else:
        return jsonify({'error': 'Não autenticado'}), 401

@bp.route('/usuarios', methods=['GET'])
def listar_usuarios():
    """Lista todos os usuários (sem senhas)"""    
    usuarios = carregar_usuarios()
    
    # Remover senhas antes de enviar
    usuarios_sem_senha = []
    for usuario in usuarios:
        usuario_copia = usuario.copy()
        usuario_copia.pop('senha', None)
        usuarios_sem_senha.append(usuario_copia)
    
    return jsonify(usuarios_sem_senha)

@bp.route('/usuarios/<string:cpf>', methods=['DELETE'])
def deletar_usuario(cpf):
    """Deleta um usuário com validações"""
    # Verificar se há usuário logado
    if 'usuario_logado' not in session:
        return jsonify({'success': False, 'message': 'Não autenticado'}), 401
    
    usuario_logado = session['usuario_logado']
    
    # Validação 1: Não pode deletar o próprio perfil
    if usuario_logado.get('cpf') == cpf:
        return jsonify({
            'success': False, 
            'message': 'Você não pode deletar seu próprio perfil'
        }), 400
    
    usuarios = carregar_usuarios()
    
    # Encontrar o usuário a ser deletado
    usuario_index = None
    usuario_a_deletar = None
    for i, usuario in enumerate(usuarios):
        if usuario.get('cpf') == cpf:
            usuario_index = i
            usuario_a_deletar = usuario
            break
    
    if usuario_index is None:
        return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 404
    
    # Validação 2: Sempre deve haver pelo menos um funcionário
    if usuario_a_deletar.get('role') == 'funcionario':
        # Contar quantos funcionários existem
        total_funcionarios = sum(1 for u in usuarios if u.get('role') == 'funcionario')
        
        if total_funcionarios <= 1:
            return jsonify({
                'success': False, 
                'message': 'Não é possível deletar o último funcionário do sistema'
            }), 400
    
    # Remover usuário
    usuarios.pop(usuario_index)
    salvar_usuarios(usuarios)
    
    return jsonify({'success': True, 'message': 'Usuário deletado com sucesso'})

@bp.route('/logout', methods=['POST'])
def logout():
    """Faz logout do usuário"""
    session.pop('usuario_logado', None)
    return jsonify({'success': True})
