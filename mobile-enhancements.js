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

  // Update mobile warrior counts when desktop counts change
  function syncMobileWarriorCounts() {
    const blueCount = document.getElementById('blue-count');
    const redCount = document.getElementById('red-count');
    const mobileBlueCount = document.getElementById('mobile-blue-count');
    const mobileRedCount = document.getElementById('mobile-red-count');
    
    if (blueCount && mobileBlueCount) {
      // Extract just the number from "X Warriors + King"
      const blueText = blueCount.textContent;
      const blueNumber = blueText.match(/\d+/);
      if (blueNumber) {
        mobileBlueCount.textContent = blueNumber[0];
      }
    }
    
    if (redCount && mobileRedCount) {
      // Extract just the number from "X Warriors + King"
      const redText = redCount.textContent;
      const redNumber = redText.match(/\d+/);
      if (redNumber) {
        mobileRedCount.textContent = redNumber[0];
      }
    }
  }
  
  // Set up observers to watch for changes in warrior counts
  const blueCountElement = document.getElementById('blue-count');
  const redCountElement = document.getElementById('red-count');
  
  if (blueCountElement && redCountElement) {
    // Use MutationObserver to watch for text changes
    const observer = new MutationObserver(syncMobileWarriorCounts);
    
    observer.observe(blueCountElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    observer.observe(redCountElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
  // Initial sync
  syncMobileWarriorCounts();
}

// Function to expand button bar after victory
function expandButtonBar() {
  const mobileButtons = document.querySelector('.mobile-buttons');
  const mobileGameButtons = document.querySelectorAll('.mobile-game-button');
  
  if (mobileButtons && mobileGameButtons.length > 0) {
    // Add expanded class to container
    mobileButtons.classList.add('expanded');
    
    // Add expanded class to individual buttons
    mobileGameButtons.forEach(button => {
      button.classList.add('expanded');
    });
    
    console.log('Mobile button bar expanded after victory!');
  }
}

// Function to trigger button expansion after victory (2 second delay)
function triggerVictoryButtonExpansion() {
  console.log('Victory detected, expanding buttons in 2 seconds...');
  setTimeout(() => {
    expandButtonBar();
  }, 2000);
}

// Function to collapse button bar (reset to icon mode)
function collapseButtonBar() {
  const mobileButtons = document.querySelector('.mobile-buttons');
  const mobileGameButtons = document.querySelectorAll('.mobile-game-button');
  
  if (mobileButtons && mobileGameButtons.length > 0) {
    // Remove expanded class from container
    mobileButtons.classList.remove('expanded');
    
    // Remove expanded class from individual buttons
    mobileGameButtons.forEach(button => {
      button.classList.remove('expanded');
    });
    
    console.log('Mobile button bar collapsed to icon mode');
  }
}

// Make functions available globally for game to call
window.expandButtonBar = expandButtonBar;
window.triggerVictoryButtonExpansion = triggerVictoryButtonExpansion;
window.collapseButtonBar = collapseButtonBar;

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
