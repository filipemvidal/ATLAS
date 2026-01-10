# ATLAS - Sistema de Gestão de Biblioteca

Sistema web completo para gerenciamento de biblioteca desenvolvido com Flask, incluindo cadastro de leitores, controle de empréstimos e devoluções, sistema de reservas e catálogo de livros.

## 📋 Funcionalidades

- **Autenticação**: Login e cadastro de usuários (funcionários, professores e estudantes)
- **Gestão de Livros**: CRUD completo de livros do acervo
- **Gestão de Usuários**: Visualização e gerenciamento de leitores
- **Empréstimos**: Sistema de empréstimo via CPF com validações (máximo 3 livros, débito máximo R$ 10,00)
- **Devoluções**: Registro de devoluções com cálculo automático de multas (R$ 1,00/dia)
- **Renovações**: Renovação de empréstimos com restrições (até 5 dias antes da devolução)
- **Reservas**: Sistema de fila de reservas quando não há exemplares disponíveis
- **Meus Empréstimos**: Página para leitores visualizarem seus empréstimos ativos, histórico e reservas

## 🗂️ Estrutura do Projeto

```
ATLAS-ModelagemSistemas/
│
├── app/                          # Diretório principal da aplicação
│   ├── __init__.py              # Inicialização do pacote app
│   ├── controllers/             # Controladores (lógica de negócio)
│   │   ├── __init__.py
│   │   ├── main_controller.py   # Rotas principais (home, readers, borrows)
│   │   ├── auth_controller.py   # Autenticação (login, register, logout)
│   │   ├── books_controller.py  # CRUD de livros
│   │   └── emprestimos_controller.py  # Empréstimos, devoluções, renovações, reservas
│   │
│   ├── static/                  # Arquivos estáticos (CSS, JS, imagens)
│   │   ├── css/
│   │   │   ├── home.css         # Estilos da página inicial
│   │   │   ├── login.css        # Estilos da página de login
│   │   │   ├── register.css     # Estilos da página de cadastro
│   │   │   ├── readers.css      # Estilos da página de leitores
│   │   │   └── borrows.css      # Estilos da página de empréstimos
│   │   │
│   │   └── js/
│   │       ├── home.js          # Lógica da página inicial (livros)
│   │       ├── login.js         # Lógica de autenticação
│   │       ├── register.js      # Lógica de cadastro
│   │       ├── readers.js       # Lógica da página de leitores
│   │       └── borrows.js       # Lógica da página de empréstimos do leitor
│   │
│   └── views/                   # Templates HTML
│       ├── index.html           # Página de login
│       ├── register.html        # Página de cadastro
│       ├── home.html            # Página inicial (catálogo de livros)
│       ├── readers.html         # Página de gerenciamento de leitores
│       └── borrows.html         # Página de empréstimos do leitor
│
├── data/                        # Arquivos JSON (banco de dados)
│   ├── usuarios.json            # Dados dos usuários
│   └── livros.json              # Dados dos livros
│
├── app.py                       # Arquivo principal da aplicação Flask
├── config.py                    # Configurações da aplicação
├── requirements.txt             # Dependências Python
├── .gitignore                   # Arquivos ignorados pelo Git
└── README.md                    # Este arquivo
```

## 🔧 Tecnologias Utilizadas

- **Backend**: Flask 3.0.0 (Python)
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Persistência**: JSON (arquivos locais)
- **Autenticação**: Flask Session

## ⚙️ Pré-requisitos

- Python 3.8 ou superior

### Instalando o venv (se necessário)

O módulo `venv` geralmente já vem incluído nas instalações padrão do Python 3.3+. Caso não esteja disponível:

**Windows:**
```bash
# Normalmente já vem instalado com Python
# Se não funcionar, reinstale o Python marcando "pip" e "py launcher" na instalação
```

**Linux (Debian/Ubuntu):**
```bash
sudo apt update
sudo apt install python3-venv
```

**Linux (Fedora/Red Hat):**
```bash
sudo dnf install python3-virtualenv
```

**Mac:**
```bash
# Normalmente já vem instalado com Python
# Se não funcionar, reinstale o Python via Homebrew:
brew install python3
```

## 📦 Instalação e Execução

1. **Clone o repositório**
   ```bash
   git clone https://github.com/filipemvidal/ATLAS-Backend.git
   cd ATLAS-ModelagemSistemas
   ```

2. **Crie um ambiente virtual**
   ```bash
   python -m venv venv
   ```

3. **Ative o ambiente virtual**
   
   **Windows:**
   ```bash
   .\venv\Scripts\Activate.ps1
   ```
   
   **Linux/Mac:**
   ```bash
   source venv/bin/activate
   ```

4. **Instale as dependências**
   ```bash
   pip install -r requirements.txt
   ```

5. **Execute a aplicação**
   ```bash
   python app.py
   ```

6. **Acesse no navegador**
   ```
   http://127.0.0.1:5000
   ```

## 👥 Usuários Padrão

O sistema vem com alguns usuários pré-cadastrados para teste:

| Tipo | Nome | CPF | Matrícula | Senha |
|------|------|-----|-----------|-------|
| Funcionário | João Silva | 12345678909 | 100000001 | 1234 |
| Professor | Maria Santos | 76841799003 | 200000001 | 1234 |
| Estudante | Pedro Oliveira | 77183381005 | 300000001 | 1234 |

## 📚 Regras de Negócio

### Empréstimos
- **Prazo**: 14 dias
- **Limite**: Máximo de 3 livros por leitor
- **Débito máximo**: R$ 10,00
- **Multa**: R$ 1,00 por dia de atraso
- **Restrição**: Funcionários não podem emprestar livros

### Renovações
- Só podem ser feitas até **5 dias antes** da data de devolução
- Bloqueadas se houver débito pendente (≥ R$ 10,00)
- Estendem o prazo por mais **14 dias** a partir da data da renovação

### Reservas
- Só disponíveis quando **não há exemplares disponíveis**
- Sistema de fila por ordem de chegada
- Empréstimo automático ao primeiro da fila quando há devolução

### Status dos Empréstimos
- **Ativo**: Empréstimo dentro do prazo
- **Em atraso**: Empréstimo vencido
- **Devolvido-em-atraso**: Devolvido com débito pendente
- **Devolvido**: Finalizado sem pendências

## 🛠️ Desenvolvimento

### Estrutura de Controllers (Blueprints)

- **main_controller**: Rotas principais da aplicação
- **auth_controller**: Autenticação e gerenciamento de usuários
- **books_controller**: CRUD de livros
- **emprestimos_controller**: Toda lógica de empréstimos, devoluções, renovações e reservas

### Endpoints da API

#### Autenticação
- `POST /api/login` - Login de usuário
- `POST /api/register` - Cadastro de novo usuário
- `POST /api/logout` - Logout
- `GET /api/usuarios` - Listar todos os usuários
- `DELETE /api/usuarios/<cpf>` - Deletar usuário

#### Livros
- `GET /api/books/` - Listar todos os livros
- `POST /api/books/` - Adicionar novo livro
- `PUT /api/books/<id>` - Atualizar livro
- `DELETE /api/books/<id>` - Deletar livro

#### Empréstimos
- `POST /api/emprestimos/emprestar` - Emprestar livro (funcionário via CPF)
- `POST /api/emprestimos/emprestar-direto` - Emprestar livro (leitor logado)
- `POST /api/emprestimos/reservar` - Reservar livro
- `POST /api/emprestimos/cancelar-reserva` - Cancelar reserva
- `POST /api/emprestimos/devolver` - Registrar devolução
- `POST /api/emprestimos/retirar-debito` - Pagar débito
- `POST /api/emprestimos/renovar` - Renovar empréstimo
- `GET /api/emprestimos/debito/<cpf>` - Consultar débito total

## 📝 Licença

Este projeto foi desenvolvido para fins acadêmicos no curso de Modelagem de Sistemas.
