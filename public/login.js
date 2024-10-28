const btnLoginPopup = document.querySelector('.btnLogin-popup');
const wrapper = document.querySelector('.wrapper');
const overlay = document.querySelector('.overlay');
const iconClose = document.querySelector('.icon-close');
const registerLink = document.querySelector('.register-link');
const loginLink = document.querySelector('.login-link');
const cardLinks = document.querySelectorAll('.card-link'); // Seleciona todos os links dos cards

// Abre o popup de login ao clicar no botão de login
btnLoginPopup.addEventListener('click', () => {
    wrapper.classList.add('show');
    overlay.classList.add('show');
    wrapper.querySelector('.form-box.login').style.display = 'block'; // Mostra o formulário de login
    wrapper.querySelector('.form-box.register').style.display = 'none'; // Oculta o formulário de registro
});

function openLoginPopup(link) {
    wrapper.classList.add('show');
    overlay.classList.add('show');
    wrapper.querySelector('.form-box.login').style.display = 'block'; // Mostra o formulário de login
    wrapper.querySelector('.form-box.register').style.display = 'none'; // Oculta o formulário de registro
    // Opcional: Salvar o link do curso para redirecionar após o login
    sessionStorage.setItem('redirectLink', link);
}


// Abre o popup de login ao clicar em qualquer card
cardLinks.forEach(cardLink => {
    cardLink.addEventListener('click', (e) => {
        e.preventDefault(); // Previne o redirecionamento para "login.html"
        wrapper.classList.add('show');
        overlay.classList.add('show');
        wrapper.querySelector('.form-box.login').style.display = 'block'; // Mostra o formulário de login
        wrapper.querySelector('.form-box.register').style.display = 'none'; // Oculta o formulário de registro
    });
});

// Fecha o popup
iconClose.addEventListener('click', () => {
    wrapper.classList.remove('show');
    overlay.classList.remove('show');
});

// Abre o formulário de registro
registerLink.addEventListener('click', (e) => {
    e.preventDefault();
    wrapper.querySelector('.form-box.login').style.display = 'none'; // Oculta login
    wrapper.querySelector('.form-box.register').style.display = 'block'; // Exibe registro
});

// Abre o formulário de login
loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    wrapper.querySelector('.form-box.register').style.display = 'none'; // Oculta registro
    wrapper.querySelector('.form-box.login').style.display = 'block'; // Exibe login
});
