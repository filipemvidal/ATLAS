// Formatar CPF automaticamente enquanto digita
const cpfInput = document.getElementById('cpf');
if (cpfInput) {
    cpfInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length <= 11) {
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            e.target.value = value;
        }
    });
}

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


async function handleRegister(event)
{
    event.preventDefault();

    const cpf = document.getElementById('cpf').value.replace(/\D/g, '');
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const matricula = document.getElementById('matricula').value;
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmar_senha').value;
    const role = document.getElementById('role').value;

    if (!validarCPF(cpf)) {
        alert('CPF inválido! Verifique o número digitado.');
        return;
    }

    if(senha !== confirmarSenha){
        alert('As senhas não coincidem! Por favor, verifique.');
        return;
    }

    if (!role) {
        alert('Por favor, selecione o tipo de usuário.');
        return;
    }

    try {
        // Enviar dados para o backend
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome,
                cpf,
                email,
                matricula,
                senha,
                role
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('Registro realizado com sucesso! Você já pode fazer login.');
            window.location.href = '/';
        } else {
            alert(data.message || 'Erro ao realizar cadastro. Tente novamente.');
        }
    } catch (error) {
        console.error('Erro ao fazer cadastro:', error);
        alert('Erro ao conectar com o servidor. Tente novamente.');
    }
}