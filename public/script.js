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