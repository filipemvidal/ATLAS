const usuarios = [{
        nome: "Funcionário",
        cpf:"12345678909",
        password: "1234",
        role: "Funcionario"
    },{
        nome: "Professor",
        cpf:"76841799003",
        password: "1234",
        role: "Professor"  
    },{
        nome: "Aluno",
        cpf:"77183381005",
        password: "1234",
        role: "Aluno"
    }
];

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

function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11) {
        return false;
    }
    
    if (/^(\d)\1{10}$/.test(cpf)) {
        return false;
    }
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) {
        return false;
    }
    
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
    event.preventDefault();

    const cpf = document.getElementById('cpf').value;
    const senha = document.getElementById('senha').value;

    if (!cpf || !senha) {
        alert('Por favor, preencha todos os campos!');
        return;
    }

    if (!validarCPF(cpf)) {
        alert('CPF inválido! Verifique o número digitado.');
        return;
    }

    let usuarioEncontrado = null;
    
    // MODIFICAR: buscar na base de dados
    for(let i=0; i<usuarios.length; i++){
        if(usuarios[i].cpf === cpf && usuarios[i].password === senha) {
            usuarioEncontrado = usuarios[i]
            break;
        }
    }
    // FIM-MODIFICAR
    
    if (usuarioEncontrado) {
        sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioEncontrado));
        window.location.href = './src/static/html/home.html';
    } else {
        alert('CPF ou senha incorretos!');
    }
}