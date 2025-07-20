class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        
        // Initialize game state
        this.snake = [];
        this.food = null;
        this.direction = 'right';
        this.score = 0;
        this.highScore = this.getHighScore();
        this.gameOver = true; // Start with game over state
        this.interval = null;
        this.gameSpeed = 100;
        
        // Set base dimensions (these will be scaled by resizeCanvas)
        this.baseWidth = 600;
        this.baseHeight = 400;
        
        // Setup game and controls
        this.setupGame();
        this.setupControls();
        this.updateHighScoreDisplay();
        
        // Set initial canvas size after game is initialized
        this.resizeCanvas();
        
        // Handle window resize
        window.addEventListener('resize', () => this.resizeCanvas());
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

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            switch(e.key.toLowerCase()) {
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
            this.startGame();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetGame();
        });
    }

    getHighScore() {
        return parseInt(localStorage.getItem('snekExtremeHighScore')) || 0;
    }

    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snekExtremeHighScore', this.highScore.toString());
            this.updateHighScoreDisplay();
        }
    }

    updateHighScoreDisplay() {
        document.getElementById('highScore').textContent = this.highScore;
    }

    startGame() {
        this.gameOver = false;
        this.score = 0;
        document.getElementById('score').textContent = this.score;
        this.setupGame();
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(() => this.gameLoop(), this.gameSpeed);
        this.draw();
    }

    resetGame() {
        this.gameOver = true;
        this.snake = [];
        this.food = null;
        this.score = 0;
        document.getElementById('score').textContent = '0';
        this.highScore = this.getHighScore();
        this.updateHighScoreDisplay();
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.draw();
    }

    gameLoop() {
        if (this.gameOver) return;

        this.update();
    }

    update() {
        const head = { ...this.snake[0] };

        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // Check for wall collisions
        if (head.x < 0 || head.x >= this.canvas.width / this.gridSize ||
            head.y < 0 || head.y >= this.canvas.height / this.gridSize) {
            this.gameOver = true;
            return;
        }

        // Check for self collision
        for (let i = 0; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.gameOver = true;
                return;
            }
        }

        // Add new head
        this.snake.unshift(head);

        // Check for food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score++;
            document.getElementById('score').textContent = this.score;
            this.updateHighScore();
            this.spawnFood();
        } else {
            this.snake.pop();
        }
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

        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            requestAnimationFrame(() => this.draw());
        }
    }
}

// Initialize game
const game = new Game();
