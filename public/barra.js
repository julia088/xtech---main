function backToPage() {
    window.location.href = 'portalAluno.html';
}

const progressBar = document.querySelector(".progress");
const form = document.getElementById('quiz-form');

let width = 0;
const quizIncrement = 5; // Incremento de 5% por resposta correta

function getCursoId() {
    return document.body.getAttribute("data-curso-id") || "default";
}

function loadProgress() {
    const cursoId = getCursoId();
    fetch(`/obterProgresso?cursoId=${cursoId}`, {
        method: 'GET',
    }).then(response => response.json()).then(data => {
        if (data.progresso) {
            width = data.progresso;
            updateProgressBar();
        }
    }).catch(error => console.error('Erro ao carregar progresso:', error));
}

function saveProgress() {
    const cursoId = getCursoId();
    fetch('/salvarProgresso', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cursoId, progresso: width }),
    }).then(response => response.json()).then(data => {
        console.log(data.message);
    }).catch(error => console.error('Erro ao salvar progresso:', error));
}

function updateProgressBar() {
    progressBar.style.width = width + "%";
    progressBar.textContent = width + "%";
}

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

if (form) {
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        verificarRespostas();
    });
}

function advanceProgress(element) {
    const videoIncrement = 25;
    if (width < 100) {
        width += videoIncrement;
        if (width > 100) {
            width = 100;
        }
        updateProgressBar();
    }
    element.style.display = "none";
}

window.onload = loadProgress;