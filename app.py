from flask import Flask, render_template
from app.controllers import main_controller, auth_controller, books_controller

app = Flask(__name__, 
            template_folder='app/views',
            static_folder='app/static')

# Configurações
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Alterar em produção

# Registrar blueprints
app.register_blueprint(main_controller.bp)
app.register_blueprint(auth_controller.bp)
app.register_blueprint(books_controller.bp)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
