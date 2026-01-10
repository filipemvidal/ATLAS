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
        'role': role
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

@bp.route('/logout', methods=['POST'])
def logout():
    """Faz logout do usuário"""
    session.pop('usuario_logado', None)
    return jsonify({'success': True})
