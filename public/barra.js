// barra.js
function backToPage() {
    window.location.href = 'portalAluno.html';
}

// Seleciona a barra de progresso e o formulário de quiz
const progressBar = document.querySelector(".progress");
const form = document.getElementById('quiz-form');

let width = 0;
const quizIncrement = 5; // Incremento de 5% por resposta correta

// Função para obter o ID do curso da página atual
function getCursoId() {
    return document.body.getAttribute("data-curso-id") || "default";
}

// Função para carregar o progresso do curso a partir do backend
function loadProgress() {
    const cursoId = getCursoId();
    fetch(`/obterProgresso?cursoId=${cursoId}`, {
        method: 'GET',
    })
    .then(response => response.json())
    .then(data => {
        if (data.progresso) {
            width = data.progresso;
            updateProgressBar();
        }
    })
    .catch(error => console.error('Erro ao carregar progresso:', error));
}

// Função para salvar o progresso do curso no backend
function saveProgress() {
    const cursoId = getCursoId();
    fetch('/salvarProgresso', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cursoId, progresso: width }),
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message);
    })
    .catch(error => console.error('Erro ao salvar progresso:', error));
}

// Atualiza a barra de progresso com o valor atual
function updateProgressBar() {
    progressBar.style.width = width + "%";
    progressBar.textContent = width + "%";
}

// Função para verificar as respostas do quiz e calcular o progresso com base nas respostas corretas
function verificarRespostas() {
    const respostasCorretas = {
        q1: "correta",
        q2: "correta",
        q3: "correta",
        q4: "correta",
        q5: "correta"
    };

    let acertos = 0;
    const totalQuestoes = Object.keys(respostasCorretas).length;

    for (let pergunta in respostasCorretas) {
        const respostaSelecionada = form.elements[pergunta].value;
        if (respostaSelecionada === respostasCorretas[pergunta]) {
            acertos++;
        }
    }

    const erros = totalQuestoes - acertos;

    // Calcula o incremento de progresso com base no número de acertos
    if (acertos > 0) {
        width += quizIncrement * acertos;
        if (width > 100) {
            width = 100; 
        }
        updateProgressBar();
        saveProgress();
    }

    alert(`Você acertou ${acertos} de ${totalQuestoes} perguntas e errou ${erros}.`);
}

// Adiciona evento ao formulário de quiz para verificar respostas ao submeter
if (form) {
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        verificarRespostas();
    });
}

// Função para avançar o progresso do curso em 25% quando o vídeo é completado
function advanceProgress(element) {
    const videoIncrement = 25;
    if (width < 100) {
        width += videoIncrement; 
        if (width > 100) {
            width = 100; 
        }
        updateProgressBar();
        saveProgress();
    }
    element.style.display = "none";
}

// Carrega o progresso do curso quando a página é carregada
window.onload = loadProgress;