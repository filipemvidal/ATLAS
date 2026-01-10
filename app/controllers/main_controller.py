from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session
import json
import os

bp = Blueprint('main', __name__)

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

@bp.route('/')
def index():
    """Página de login"""
    return render_template('index.html')

@bp.route('/register')
def register():
    """Página de cadastro"""
    return render_template('register.html')

@bp.route('/home')
def home():
    """Página principal"""
    return render_template('home.html')

@bp.route('/readers')
def readers():
    """Página de gerenciamento de leitores"""
    return render_template('readers.html')

@bp.route('/borrows')
def borrows():
    """Página de gerenciamento de empréstimos"""
    return render_template('borrows.html')

@bp.route('/api/login', methods=['POST'])
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

@bp.route('/api/usuario')
def get_usuario():
    """Retorna dados do usuário logado"""
    if 'usuario_logado' in session:
        return jsonify(session['usuario_logado'])
    else:
        return jsonify({'error': 'Não autenticado'}), 401
