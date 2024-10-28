function myFunction() {
    window.location.href = "login.html";
}

function redirectToPage() {
    window.location.href = '';
}

function profileEdit() {
    window.location.href = "perfilAluno.html";
}

//cards dos cursos
const data = [
    {
      icon: "bi bi-filetype-html",  
      title: "HTML",
      description: "Aprenda a estruturar páginas web com HTML, a base fundamental para todo desenvolvimento online e criação de sites.",
      button: "Inscreva-se",
      link: "#",
    },
   
    {
        icon: "bi bi-filetype-css",
        title: "CSS",
        description: "Domine o design e a estilização de sites com CSS, tornando suas páginas visualmente atraentes e responsivas em diferentes dispositivos.",
        button: "Inscreva-se",
        link: "#",
    },
     
    {
        icon: "bi bi-filetype-js",
        title: "JS",
        description: "Descubra como tornar suas páginas interativas e dinâmicas com JavaScript, a linguagem essencial para o desenvolvimento moderno na web.",
        button: "Inscreva-se",
        link: "#",
    },
     
    {
        icon: "bi bi-filetype-py",
        title: "Python",
        description: "Explore a versatilidade do Python, ideal para automação, análise de dados, desenvolvimento web e várias aplicações em programação.",
        button: "Inscreva-se",
        link: "#",
    },
   
    {
        icon: "bi bi-filetype-rb",
        title: "Ruby",
        description: "Mergulhe no desenvolvimento ágil com Ruby, uma linguagem elegante e produtiva, excelente para criar aplicações web de alta qualidade.",
        button: "Inscreva-se",
        link: "#",
    },
   
    {
        icon: "bi bi-git",
        title: "Git",
        description: "Aprenda a versionar e gerenciar seu código eficientemente com Git, essencial para a colaboração em projetos de software e equipes.",
        button: "Inscreva-se",
        link: "#",
    },
   
    {
        icon: "bi bi-filetype-php",
        title: "PHP",
        description: "Descubra como construir aplicações web dinâmicas com PHP, uma das linguagens mais populares para desenvolvimento backend e criação de sites.",
        button: "Inscreva-se",
        link: "#",
    },
   
    {
        icon: "bi bi-filetype-sql",
        title: "SQL",
        description: "Domine a manipulação de bancos de dados com SQL, essencial para gerenciar, consultar e analisar informações de forma eficaz e eficiente.",
        button: "Inscreva-se",
        link: "#",
    },
   
    {
        icon: "bi bi-currency-bitcoin",
        title: "Crypto",
        description: "Entenda os fundamentos das criptomoedas e blockchain, explorando seu impacto, aplicações e o futuro financeiro que eles proporcionam.",
        button: "Inscreva-se",
        link: "#",
    },
];


const cardContainer = document.querySelector(".card-container");
const searchInput = document.querySelector("#searchInput");

const displayData = (data) => {
    cardContainer.innerHTML = "";
    data.forEach(e => {
        cardContainer.innerHTML += `
        <div class="card">
        <i class="${e.icon}"></i>
        <h3>${e.title}</h3>
        <p>${e.description}</p>
         <button class="btn-cursos" onclick="openLoginPopup('${e.link}')">${e.button}</button>
        </div>
        `;
    });
};

searchInput.addEventListener("keyup", (e) => {
    const search = data.filter(i => i.title.toLowerCase().includes(e.target.value.toLowerCase()));
    displayData(search);
});

window.addEventListener("load", displayData.bind(null, data));