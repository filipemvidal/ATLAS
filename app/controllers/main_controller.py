from flask import Blueprint, render_template, session, redirect, url_for

bp = Blueprint('main', __name__)

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
    # Verifica se o usuário está logado
    if 'usuario_logado' not in session:
        return redirect(url_for('main.index'))
    
    return render_template('home.html', usuario=session['usuario_logado'])

@bp.route('/readers')
def readers():
    """Página de gerenciamento de leitores"""
    # Verifica se o usuário está logado
    if 'usuario_logado' not in session:
        return redirect(url_for('main.index'))
    
    return render_template('readers.html', usuario=session['usuario_logado'])

@bp.route('/borrows')
def borrows():
    """Página de empréstimos do leitor (Meus Empréstimos)"""
    # Verifica se o usuário está logado
    if 'usuario_logado' not in session:
        return redirect(url_for('main.index'))
    
    return render_template('borrows.html', usuario_logado=session['usuario_logado'])
