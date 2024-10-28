new Swiper('.card-wrapper', {
    loop: true,
    spaceBetween: 30,
  
    // If we need pagination
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
      dynamicBullets: true,
    },
  
    // Navigation arrows
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },

    breakpoints: {
        0: {
            slidesPerView: 1
        },
        768: {
            slidesPerView: 2
        },
        1024: {
            slidesPerView: 3
        },
    }
  });

  // Função para carregar o progresso de todos os cursos
function loadAllProgress() {
  fetch('/progresso') // Rota que você criou no backend
      .then(response => response.json())
      .then(data => {
          // Atualizar as barras de progresso no carrossel
          data.forEach(item => {
              const progressElement = document.querySelector(`.progress[data-curso-id="${item.curso_id}"]`);
              if (progressElement) {
                  const progresso = item.progresso; // Supondo que progresso é um valor percentual (0 a 100)
                  progressElement.style.width = progresso + '%';
                  progressElement.textContent = progresso + '%';
              }
          });
      })
      .catch(error => {
          console.error('Erro ao buscar progresso:', error);
      });
}

// Chame a função ao carregar a página
document.addEventListener('DOMContentLoaded', loadAllProgress);