class Game {
    constructor() {
        // Performance monitoring
        this.fps = 0;
        this.tps = 0;
        this.frameCount = 0;
        this.updateCount = 0;
        this.lastFpsUpdate = 0;
        this.lastTpsUpdate = 0;
        this.lastFrameTime = 0;
        this.lastUpdateTime = 0;
        this.accumulator = 0;

        // Game constants
        this.maxTps = 60; // Maximum updates per second
        this.baseMsPerUpdate = 1000 / this.maxTps;
        this.msPerUpdate = this.baseMsPerUpdate; // Will be adjusted by difficulty

        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 10;

        // Create debug display
        this.createDebugDisplay();

        // Initialize game state
        this.snake = [];
        this.food = null;
        this.direction = 'right';
        this.score = 0;
        this.highScore = this.getHighScore();
        this.gameOver = false; // Start with game over state
        this.interval = null;
        this.rocks = [];

        // Difficulty settings
        this.difficultySettings = {
            baby: { speed: 150, display: 'Baby', style: "background: rgba(10, 202, 236, 0.2);color:rgb(58, 219, 211);" },
            easy: { speed: 120, display: 'Easy', style: "background: rgba(76, 175, 80, 0.2);color: #4CAF50;" },
            normal: { speed: 100, display: 'Normal', style: "background: rgba(76, 175, 80, 0.2);color:rgba(76, 175, 79, 0.53);" },
            medium: { speed: 75, display: 'Medium', style: "background: rgba(153, 175, 76, 0.2);color:rgb(165, 175, 76);" },
            hard: { speed: 50, display: 'Hard', style: "background: rgba(175, 157, 76, 0.2);color:rgb(175, 135, 76);" },
            extreme: { speed: 25, display: 'Extreme', style: "background: rgba(175, 76, 76, 0.2);color:rgb(175, 76, 76);" },
            insane: { speed: 20, display: 'Insane', style: "background: rgba(139, 76, 175, 0.2);color:rgb(122, 76, 175);" },
            stupid: { speed: 10, display: 'Bro what is tis', style: "background: rgba(175, 76, 150, 0.2);color:rgb(175, 76, 153);" },
            legend: { speed: 5, display: "I'M LEGENDARY BOI", style: "background: rgba(202, 202, 202, 0.85);color:rgb(255, 255, 255);" }
        };

        // Set default difficulty
        this.difficulty = 'normal';

        // Set base dimensions (these will be scaled by resizeCanvas)
        this.baseWidth = 600;
        this.baseHeight = 400;

        // Game state
        this.isPaused = true;

        // Setup game and controls
        this.setupGame();
        this.setupControls();
        this.updateHighScoreDisplay();

        // Set initial canvas size after game is initialized
        this.resizeCanvas();

        // Handle window resize
        window.addEventListener('resize', () => this.resizeCanvas());

        // Handle pause on window blur
        window.addEventListener('blur', () => {
            if (!this.gameOver && !this.isPaused) {
                this.togglePause();
            }
        });
    }

    setupGame() {
        this.snake = [{ x: 10, y: 10 }];
        this.spawnFood();
    }

    resizeCanvas() {
        // Get the container dimensions
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth - 40; // Account for padding

        // Calculate dimensions that maintain aspect ratio
        const aspectRatio = this.baseWidth / this.baseHeight;
        let newWidth = containerWidth;
        let newHeight = containerWidth / aspectRatio;

        // Apply the new dimensions
        this.canvas.width = this.baseWidth;
        this.canvas.height = this.baseHeight;
        this.canvas.style.width = `${newWidth}px`;
        this.canvas.style.height = `${newHeight}px`;

        // Only try to redraw if the game is initialized and not over
        if (this.snake && this.snake.length > 0 && !this.gameOver) {
            this.draw();
        } else if (this.snake && this.snake.length > 0) {
            // If game is over but snake exists, just draw the initial state
            this.draw();
        }
    }

    spawnFood() {
        const maxX = Math.floor(this.canvas.width / this.gridSize) - 1;
        const maxY = Math.floor(this.canvas.height / this.gridSize) - 1;
        this.food = {
            x: Math.floor(Math.random() * maxX),
            y: Math.floor(Math.random() * maxY)
        };
    }

    spawnRock() {
        const maxX = Math.floor(this.canvas.width / this.gridSize) - 1;
        const maxY = Math.floor(this.canvas.height / this.gridSize) - 1;
        //check if rock is on snake
        if (this.snake.some(segment => segment.x === Math.floor(Math.random() * maxX) && segment.y === Math.floor(Math.random() * maxY))) {
            this.spawnRock();
            return;
        }
        this.rocks.push({
            x: Math.floor(Math.random() * maxX),
            y: Math.floor(Math.random() * maxY)
        });
    }

    togglePause() {
        if (this.gameOver) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            clearInterval(this.interval);
            this.interval = null;
            document.getElementById('pauseBtn').textContent = 'Resume';
            document.getElementById('pauseBtn').classList.add('paused');
            this.drawPauseScreen();
        } else {
            this.startGameLoop();
            document.getElementById('pauseBtn').textContent = 'Pause';
            document.getElementById('pauseBtn').classList.remove('paused');
            this.draw();
        }
    }

    startGameLoop() {
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(() => this.gameLoop(), this.gameSpeed);
    }

    drawPauseScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = 'white';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Press P or click Resume to continue', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }

    drawGameOverScreen() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Game Over text
        this.ctx.fillStyle = '#ff4d4d';
        this.ctx.font = 'bold 40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 60);

        // Final Score
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2);

        // High Score
        const highScore = this.getHighScore();
        const isNewHighScore = this.score > highScore;
        this.ctx.fillStyle = isNewHighScore ? '#4CAF50' : 'white';
        this.ctx.font = isNewHighScore ? 'bold 22px Arial' : '22px Arial';
        this.ctx.fillText(
            isNewHighScore ? 'New High Score!' : `High Score: ${highScore}`,
            this.canvas.width / 2,
            this.canvas.height / 2 + 40
        );

        // Instructions
        this.ctx.fillStyle = '#aaaaaa';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Press SPACE to play again', this.canvas.width / 2, this.canvas.height / 2 + 100);
        this.ctx.fillText('or click Start Game', this.canvas.width / 2, this.canvas.height / 2 + 130);
    }

    setupControls() {
        // Setup difficulty selector
        this.difficultySelect = document.getElementById('difficulty');
        Object.entries(this.difficultySettings).forEach(([key, value]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = value.display;
            this.difficultySelect.appendChild(option);
        });
        this.difficultySelect.value = this.difficulty;
        this.difficultySelect.disabled = false;

        this.difficultySelect.addEventListener('change', (e) => {
            if (this.gameOver) {
                this.difficulty = e.target.value;
                this.updateGameSpeed();
                this.highScore = this.getHighScore(); // Update high score for the new difficulty
                this.updateHighScoreDisplay();
            }
        });

        // Set initial game speed
        this.updateGameSpeed();

        document.addEventListener('keydown', (e) => {
            // Handle game over state
            if (this.gameOver) {
                if (e.key === ' ') {  // Space to restart
                    if (this.gameOver) {
                        this.startGame();
                    } else {
                        this.togglePause();
                    }
                }
                return;
            }

            // Handle pause with P key
            if (e.key.toLowerCase() === 'p') {
                this.togglePause();
                return;
            }

            if (this.isPaused) return;

            switch (e.key.toLowerCase()) {
                // Arrow keys
                case 'arrowup':
                    if (this.direction !== 'down') this.direction = 'up';
                    break;
                case 'arrowdown':
                    if (this.direction !== 'up') this.direction = 'down';
                    break;
                case 'arrowleft':
                    if (this.direction !== 'right') this.direction = 'left';
                    break;
                case 'arrowright':
                    if (this.direction !== 'left') this.direction = 'right';
                    break;
                // WASD keys
                case 'w':
                    if (this.direction !== 'down') this.direction = 'up';
                    break;
                case 's':
                    if (this.direction !== 'up') this.direction = 'down';
                    break;
                case 'a':
                    if (this.direction !== 'right') this.direction = 'left';
                    break;
                case 'd':
                    if (this.direction !== 'left') this.direction = 'right';
                    break;
                case 'r':
                    this.startGame();
                    break;
            }
        });

        document.getElementById('startBtn').addEventListener('click', () => {
            if (this.isPaused) {
                this.togglePause();
            } else {
                this.startGame();
            }
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetGame();
        });
    }

    getHighScore() {
        const highScores = JSON.parse(localStorage.getItem('snekExtremeHighScores') || '{}');
        return highScores[this.difficulty] || 0;
    }

    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            const highScores = JSON.parse(localStorage.getItem('snekExtremeHighScores') || '{}');
            highScores[this.difficulty] = this.highScore;
            localStorage.setItem('snekExtremeHighScores', JSON.stringify(highScores));
            this.updateHighScoreDisplay();
        }
    }

    updateHighScoreDisplay() {
        document.getElementById('highScore').textContent = this.highScore;
        const difficultyBadge = document.getElementById('currentDifficulty');
        difficultyBadge.textContent = this.difficulty.toUpperCase();
        difficultyBadge.setAttribute('data-difficulty', this.difficulty);
        difficultyBadge.style = this.difficultySettings[this.difficulty].style;

        // Update the high score display to show which difficulty it's for
        const highScoreLabel = document.querySelector('.high-score');
        highScoreLabel.setAttribute('title', `High Score (${this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1)})`);
    }

    startGame() {
        this.resetGame();
        this.gameOver = false;
        this.isPaused = false;

        // Update difficulty from selector if game is starting fresh
        if (this.snake.length === 0) {
            this.difficulty = this.difficultySelect.value;
            this.updateGameSpeed();
            this.setupGame();
        }

        document.getElementById('score').textContent = this.score;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('pauseBtn').textContent = 'Pause';
        document.getElementById('pauseBtn').classList.remove('paused');
        this.difficultySelect.disabled = true;

        // Reset performance counters
        this.frameCount = 0;
        this.updateCount = 0;
        this.lastFpsUpdate = performance.now();
        this.lastTpsUpdate = this.lastFpsUpdate;

        this.startGameLoop();
        this.draw();
    }

    resetGame() {
        this.gameOver = true;
        this.isPaused = false;
        this.snake = [];
        this.rocks = [];
        this.food = null;
        this.highScore = this.getHighScore(); // Refresh high score when resetting
        this.difficultySelect.disabled = false;
        this.score = 0;
        document.getElementById('score').textContent = '0';
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = 'Pause';
        document.getElementById('pauseBtn').classList.remove('paused');
        this.highScore = this.getHighScore();
        this.updateHighScoreDisplay();
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    createDebugDisplay() {
        // Create debug container
        this.debugContainer = document.createElement('div');
        this.debugContainer.style.position = 'absolute';
        this.debugContainer.style.top = '10px';
        this.debugContainer.style.left = '10px';
        this.debugContainer.style.color = '#00ff00';
        this.debugContainer.style.fontFamily = 'monospace';
        this.debugContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.debugContainer.style.padding = '5px';
        this.debugContainer.style.borderRadius = '5px';
        this.debugContainer.style.zIndex = '1000';

        // Create FPS counter
        this.fpsCounter = document.createElement('div');
        this.fpsCounter.textContent = 'FPS: 0';

        // Create TPS counter
        this.tpsCounter = document.createElement('div');
        this.tpsCounter.textContent = 'TPS: 0';

        // Add counters to container
        this.debugContainer.appendChild(this.fpsCounter);
        this.debugContainer.appendChild(this.tpsCounter);

        // Add to document
        document.body.appendChild(this.debugContainer);
    }

    updatePerformanceCounters(timestamp) {
        // Update FPS counter
        this.frameCount++;
        if (timestamp - this.lastFpsUpdate >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (timestamp - this.lastFpsUpdate));
            this.fpsCounter.textContent = `FPS: ${this.fps}`;
            this.frameCount = 0;
            this.lastFpsUpdate = timestamp;
        }

        // Update TPS counter
        if (timestamp - this.lastTpsUpdate >= 1000) {
            this.tps = this.updateCount;
            this.tpsCounter.textContent = `TPS: ${this.tps} (max: ${this.maxTps})`;
            this.updateCount = 0;
            this.lastTpsUpdate = timestamp;
        }
    }

    startGameLoop() {
        if (this.interval) {
            clearInterval(this.interval);
        }

        this.lastFrameTime = performance.now();
        this.lastUpdateTime = this.lastFrameTime;
        this.accumulator = 0;

        const gameLoop = (timestamp) => {
            if (this.gameOver || this.isPaused) {
                this.lastFrameTime = timestamp;
                requestAnimationFrame(gameLoop);
                return;
            }

            // Calculate delta time
            const currentTime = performance.now();
            let deltaTime = currentTime - this.lastFrameTime;
            this.lastFrameTime = currentTime;

            // Cap delta time to avoid spiral of death
            deltaTime = Math.min(deltaTime, 250);

            // Update performance counters
            this.updatePerformanceCounters(timestamp);

            // Update game state with fixed timestep
            this.accumulator += deltaTime;

            let updatesThisFrame = 0;
            const maxUpdatesPerFrame = 5; // Prevent spiral of death

            while (this.accumulator >= this.msPerUpdate && updatesThisFrame < maxUpdatesPerFrame) {
                this.update();
                this.accumulator -= this.msPerUpdate;
                this.updateCount++;
                updatesThisFrame++;
            }

            // Render the game
            this.draw();

            // Continue the game loop
            requestAnimationFrame(gameLoop);
        };

        // Start the game loop
        requestAnimationFrame(gameLoop);
    }

    updateGameSpeed() {
        const baseSpeed = this.difficultySettings[this.difficulty].speed;
        // Convert from milliseconds per update to updates per second
        const speedFactor = 1000 / baseSpeed;
        // Adjust the number of updates needed based on difficulty
        this.msPerUpdate = this.baseMsPerUpdate * (60 / speedFactor);
    }

    update() {
        if (this.gameOver || this.isPaused) return;

        const head = { ...this.snake[0] };

        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // Check for wall collisions
        if (head.x < 0 || head.x >= this.canvas.width / this.gridSize ||
            head.y < 0 || head.y >= this.canvas.height / this.gridSize) {
            this.endGame();
            return;
        }

        // Check for self collision
        for (let i = 0; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.endGame();
                return;
            }
        }

        // Add new head
        this.snake.unshift(head);

        // Check for food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            const multiplier = 1;
            this.score += multiplier;
            document.getElementById('score').textContent = this.score;
            this.updateHighScore();
            this.spawnFood();
            this.spawnRock();
        } else {
            this.snake.pop();
        }

        // Check for rock collision
        if (this.snake.some(segment => this.rocks.some(rock => segment.x === rock.x && segment.y === rock.y))) {
            this.endGame();
        }
    }

    endGame() {
        this.gameOver = true;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.drawGameOverScreen();
    }

    draw() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw snake
        this.ctx.fillStyle = '#4CAF50';
        this.snake.forEach(segment => {
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });

        // Draw food
        this.ctx.fillStyle = '#FF5722';
        this.ctx.fillRect(
            this.food.x * this.gridSize,
            this.food.y * this.gridSize,
            this.gridSize - 2,
            this.gridSize - 2
        );

        // Draw rocks
        this.ctx.fillStyle = 'gray';
        this.rocks.forEach(rock => {
            this.ctx.fillRect(
                rock.x * this.gridSize,
                rock.y * this.gridSize,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });

        if (this.interval) {
            requestAnimationFrame(() => this.draw());
        }
    }
}

// Initialize game
const game = new Game();
game.resetGame();