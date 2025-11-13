const usuarios = [{
        cpf:"12345678909",
        password: "1234",
        role: "Funcionario"
    },{
        cpf:"76841799003",
        password: "1234",
        role: "Professor"  
    },{
        cpf:"77183381005",
        password: "1234",
        role: "Aluno"
    }
];


// Função para mostrar/ocultar senha
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = event.target.closest('.toggle-password').querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Função para validar CPF
function validarCPF(cpf) {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) {
        return false;
    }
    
    // Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
    if (/^(\d)\1{10}$/.test(cpf)) {
        return false;
    }
    
    // Validação do primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) {
        return false;
    }
    
    // Validação do segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) {
        return false;
    }
    
    return true;
}

async function handleLogin(event) {
    event.preventDefault(); // Previne o envio padrão do formulário

    // Pega os valores dos campos
    const cpf = document.getElementById('cpf').value;
    const senha = document.getElementById('senha').value;

    // Validação básica
    if (!cpf || !senha) {
        alert('Por favor, preencha todos os campos!');
        return;
    }

    // Validação do CPF usando a função validadora
    if (!validarCPF(cpf)) {
        alert('CPF inválido! Verifique o número digitado.');
        return;
    }

    // Busca o usuário no array
    let usuarioEncontrado = null;
    
    for(let i=0; i<usuarios.length; i++){
        if(usuarios[i].cpf === cpf && usuarios[i].password === senha) {
            usuarioEncontrado = usuarios[i]
            break; // Para o loop quando encontrar o usuário
        }
    }
    
    if (usuarioEncontrado) {
        // Salva as informações do usuário no sessionStorage
        sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioEncontrado));
        
        // Ou use localStorage se quiser que persista mesmo após fechar o navegador
        // localStorage.setItem('usuarioLogado', JSON.stringify(usuarioEncontrado));
        
        // Redireciona para a página principal
        window.location.href = 'home.html';
    } else {
        alert('CPF ou senha incorretos!');
    }
}