// Progressive enhancement for mobile experience
document.addEventListener('DOMContentLoaded', () => {
  // Add touch feedback for buttons
  const buttons = document.querySelectorAll('button');
  buttons.forEach((button) => {
    button.addEventListener('touchstart', function () {
      this.style.transform = 'scale(0.98)';
    });

    button.addEventListener('touchend', function () {
      this.style.transform = '';
    });
  });

  // Improve form experience on mobile
  const numberInputs = document.querySelectorAll('input[type="number"]');
  numberInputs.forEach((input) => {
    // Prevent scroll on number input focus
    input.addEventListener('focus', function () {
      this.addEventListener('wheel', (e) => {
        e.preventDefault();
      });
    });

    // Add visual feedback for validation
    input.addEventListener('input', function () {
      const value = parseInt(this.value);
      const isValid = value >= 1 && value <= 999;

      this.classList.toggle('invalid', !isValid && this.value !== '');

      // Update start button state
      updateStartButtonState();
    });
  });

  function updateStartButtonState() {
    const blueValue = parseInt(document.getElementById('blue-team-number').value);
    const redValue = parseInt(document.getElementById('red-team-number').value);
    const startButton = document.getElementById('start-battle');

    const isValid = blueValue >= 1 && blueValue <= 999 && redValue >= 1 && redValue <= 999;
    startButton.disabled = !isValid;
  }

  // Add loading state to start button
  const originalStartBattle = window.startBattle;
  window.startBattle = function () {
    const button = document.getElementById('start-battle');
    button.disabled = true;
    button.innerHTML = 'Loading...';

    try {
      originalStartBattle();
    } finally {
      setTimeout(() => {
        button.disabled = false;
        button.innerHTML = 'Begin Battle!';
      }, 1000);
    }
  };

  // Prevent zoom on double tap
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (event) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);

  // Add vibration feedback on mobile (if supported)
  if ('vibrate' in navigator) {
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        navigator.vibrate(10); // Short vibration
      });
    });
  }

  // Handle viewport height changes (mobile address bar)
  function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  setViewportHeight();
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', () => {
    setTimeout(setViewportHeight, 100);
  });
});
