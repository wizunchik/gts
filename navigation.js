// navigation.js
function initNavigation() {
  // Инициализация кнопок навигации
  document.querySelectorAll('[data-screen]').forEach(button => {
    button.addEventListener('click', function() {
      const screenId = this.getAttribute('data-screen');
      showScreen(screenId);
    });
  });
  
  // Инициализация кнопок "Назад"
  document.querySelectorAll('[data-back]').forEach(button => {
    button.addEventListener('click', function() {
      const targetScreen = this.getAttribute('data-back');
      showScreen(targetScreen);
    });
  });
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(el => {
    el.style.display = 'none';
  });
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.style.display = 'block';
  }
}

export { initNavigation, showScreen };
