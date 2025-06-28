// Setup screen and game configuration
//These are configurable settings
export const userSettings = {
  blueTeamNumber: 5,
  redTeamNumber: 3,
  showUnitInfo: false,
};

export function showSetup() {
  document.getElementById('setup-screen').classList.remove('hidden');
  document.getElementById('game-ui').classList.add('hidden');
  if (window.game) {
    window.game.destroy(true);
    window.game = null;
  }
}

export function startBattle() {
  console.log();
  const blueNumber = parseInt(document.getElementById('blue-team-number').value);
  const redNumber = parseInt(document.getElementById('red-team-number').value);
  const showUnitInfo = document.getElementById('show-unit-info').checked;

  if (!blueNumber || !redNumber || blueNumber < 1 || redNumber < 1 || blueNumber > 999 || redNumber > 999) {
    alert('Please enter valid team numbers (1-999) for both kingdoms!');
    return;
  }

  userSettings.blueTeamNumber = blueNumber;
  userSettings.redTeamNumber = redNumber;
  userSettings.showUnitInfo = showUnitInfo;

  document.getElementById('blue-banner-display').textContent = `(${blueNumber})`;
  document.getElementById('red-banner-display').textContent = `(${redNumber})`;

  document.getElementById('setup-screen').classList.add('hidden');
  document.getElementById('game-ui').classList.remove('hidden');

  // Import and start the game dynamically
  import('./battlescene/index.js').then(({ startGame }) => {
    startGame();
  });
}

export function replayBattle() {
  console.log('Replaying battle with same settings:', userSettings);

  // Destroy current game if it exists
  if (window.game) {
    // Clear any fire/smoke intervals from victory ceremony
    const scene = window.game.scene.scenes[0];
    if (scene && scene.fireInterval) {
      clearInterval(scene.fireInterval);
    }
    if (scene && scene.smokeInterval) {
      clearInterval(scene.smokeInterval);
    }

    // Force cleanup of any remaining tweens and timers
    if (scene && scene.tweens) {
      scene.tweens.killAll();
    }

    // Wait a brief moment before destroying to allow cleanup
    setTimeout(() => {
      window.game.destroy(true);
      window.game = null;

      // Reset UI counters
      document.getElementById('blue-count').textContent = '5 Warriors + King';
      document.getElementById('red-count').textContent = '5 Warriors + King';

      // Start new game with same configuration after brief delay
      setTimeout(() => {
        import('./battlescene/index.js').then(({ startGame }) => {
          startGame();
        });
      }, 100); // Small delay to ensure complete cleanup
    }, 50);
  } else {
    // No existing game, start directly
    // Reset UI counters
    document.getElementById('blue-count').textContent = '5 Warriors + King';
    document.getElementById('red-count').textContent = '5 Warriors + King';

    // Start new game with same configuration
    import('./battlescene/index.js').then(({ startGame }) => {
      startGame();
    });
  }
}

export function updateGameTimer() {
  if (window.game && window.game.scene.scenes[0] && window.game.scene.scenes[0].gameStartTime) {
    const scene = window.game.scene.scenes[0];

    // Update game dimensions display
    const dimensionsElement = document.getElementById('game-dimensions');
    if (dimensionsElement && window.game.scale) {
      const width = window.game.scale.width;
      const height = window.game.scale.height;
      dimensionsElement.textContent = `Dimensions: ${width}×${height}px`;
    }

    // Stop timer if game is over
    if (scene.gameOver && scene.gameEndTime) {
      const finalTime = (scene.gameEndTime - scene.gameStartTime) / 1000;
      const timerElement = document.getElementById('game-timer');
      if (timerElement) {
        timerElement.textContent = `Final Time: ${finalTime.toFixed(1)}s`;
      }
      return;
    }

    const gameTime = (Date.now() - scene.gameStartTime) / 1000;
    const timerElement = document.getElementById('game-timer');
    if (timerElement) {
      timerElement.textContent = `Game Time: ${gameTime.toFixed(1)}s`;
    }
  } else {
    // Update dimensions even when game isn't running
    const dimensionsElement = document.getElementById('game-dimensions');
    if (dimensionsElement && window.game && window.game.scale) {
      const width = window.game.scale.width;
      const height = window.game.scale.height;
      dimensionsElement.textContent = `Dimensions: ${width}×${height}px`;
    }
  }
}

// Start timer updates
setInterval(updateGameTimer, 100);

// Show setup screen on load
document.addEventListener('DOMContentLoaded', () => {
  showSetup();
});

// Make functions available globally for HTML onclick handlers
window.startBattle = startBattle;
window.showSetup = showSetup;
window.replayBattle = replayBattle;
