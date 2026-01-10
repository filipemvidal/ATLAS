from flask import Blueprint, request, jsonify
import json
import os

bp = Blueprint('books', __name__, url_prefix='/api/books')

# Caminho para o arquivo de livros
LIVROS_FILE = os.path.join('data', 'livros.json')

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

def obter_proximo_id(livros):
    """Retorna o próximo ID disponível"""
    if not livros:
        return 1
    return max(livro.get('id', 0) for livro in livros) + 1

@bp.route('/', methods=['GET'])
def listar_livros():
    """Lista todos os livros"""
    livros = carregar_livros()
    return jsonify(livros)

@bp.route('/', methods=['POST'])
def adicionar_livro():
    """Adiciona um novo livro"""
    data = request.get_json()
    
    # Validação básica
    campos_obrigatorios = ['titulo', 'autor', 'editora', 'edicao', 'localizacao', 'exemplares_totais']
    for campo in campos_obrigatorios:
        if campo not in data or not data[campo]:
            return jsonify({'success': False, 'message': f'Campo {campo} é obrigatório'}), 400
    
    livros = carregar_livros()
    
    # Criar novo livro
    novo_livro = {
        'id': obter_proximo_id(livros),
        'titulo': data.get('titulo'),
        'autor': data.get('autor'),
        'editora': data.get('editora'),
        'edicao': data.get('edicao'),
        'isbn': data.get('isbn', ''),
        'categorias': data.get('categorias', []),
        'ano': data.get('ano'),
        'localizacao': data.get('localizacao'),
        'exemplares_totais': int(data.get('exemplares_totais', 1)),
        'exemplares_emprestados': 0,
        'fila_reservas': [],
    }
    
    livros.append(novo_livro)
    salvar_livros(livros)
    
    return jsonify({'success': True, 'livro': novo_livro}), 201

@bp.route('/<int:livro_id>', methods=['PUT'])
def editar_livro(livro_id):
    """Edita um livro existente"""
    data = request.get_json()
    livros = carregar_livros()
    
    # Encontrar o livro
    livro_index = None
    for i, livro in enumerate(livros):
        if livro.get('id') == livro_id:
            livro_index = i
            break
    
    if livro_index is None:
        return jsonify({'success': False, 'message': 'Livro não encontrado'}), 404
    
    # Atualizar livro mantendo os empréstimos
    livro_atual = livros[livro_index]
    livros[livro_index] = {
        'id': livro_id,
        'titulo': data.get('titulo', livro_atual['titulo']),
        'autor': data.get('autor', livro_atual['autor']),
        'editora': data.get('editora', livro_atual['editora']),
        'edicao': data.get('edicao', livro_atual['edicao']),
        'isbn': data.get('isbn', livro_atual.get('isbn', '')),
        'categorias': data.get('categorias', livro_atual.get('categorias', [])),
        'ano': data.get('ano', livro_atual.get('ano')),
        'localizacao': data.get('localizacao', livro_atual['localizacao']),
        'exemplares_totais': int(data.get('exemplares_totais', livro_atual['exemplares_totais'])),
        'exemplares_emprestados': livro_atual['exemplares_emprestados']
    }
    
    salvar_livros(livros)
    
    return jsonify({'success': True, 'livro': livros[livro_index]})

@bp.route('/<int:livro_id>', methods=['DELETE'])
def deletar_livro(livro_id):
    """Deleta um livro"""
    livros = carregar_livros()
    
    # Encontrar e remover o livro
    livro_encontrado = False
    for i, livro in enumerate(livros):
        if livro.get('id') == livro_id:
            # Verificar se há exemplares emprestados
            if livro.get('exemplares_emprestados', 0) > 0:
                return jsonify({
                    'success': False, 
                    'message': 'Não é possível deletar um livro com exemplares emprestados'
                }), 400
            
            livros.pop(i)
            livro_encontrado = True
            break
    
    if not livro_encontrado:
        return jsonify({'success': False, 'message': 'Livro não encontrado'}), 404
    
    salvar_livros(livros)
    
    return jsonify({'success': True, 'message': 'Livro deletado com sucesso'})
