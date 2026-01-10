from flask import Blueprint, render_template, request, jsonify, redirect, url_for

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
    return render_template('home.html')

@bp.route('/readers')
def readers():
    """Página de gerenciamento de leitores"""
    return render_template('readers.html')

@bp.route('/borrows')
def borrows():
    """Página de gerenciamento de empréstimos"""
    return render_template('borrows.html')
