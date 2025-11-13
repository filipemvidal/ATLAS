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


async function handleRegister(event)
{
    event.preventDefault(); // Previne o envio padrão do formulário

    // Pega os valores dos campos
    const cpf = document.getElementById('cpf').value;
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const matricula = document.getElementById('matricula').value;
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmar_senha').value;

    // Validação do CPF usando a função validadora
    if (!validarCPF(cpf)) {
        alert('CPF inválido! Verifique o número digitado.');
        return;
    }

    if(senha !== confirmarSenha){
        alert('As senhas não coincidem! Por favor, verifique.');
        return;
    }

    // Aqui você pode adicionar a lógica de autenticação
    // Por enquanto, vamos apenas simular um redirecionamento
    console.log('Cadasrando:', { nome, email, cpf, matricula, senha });
    
    document.getElementById('registerForm').reset();
}