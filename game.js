// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 500;

// Game State
let gameState = 'start'; // start, playing, paused, gameOver
let score = 0;
let highScore = localStorage.getItem('skyRacerHighScore') || 0;
let animationId;

// Update score display
document.getElementById('score').textContent = score;
document.getElementById('highScore').textContent = highScore;

// Player Object
const player = {
    x: 100,
    y: canvas.height / 2,
    width: 50,
    height: 30,
    speed: 5,
    dy: 0,
    gravity: 0.3,
    jumpStrength: -7,
    maxSpeed: 8
};

// Arrays for game objects
let obstacles = [];
let stars = [];
let clouds = [];
let particles = [];

// Game Settings
const obstacleSettings = {
    minGap: 150,
    maxGap: 250,
    minHeight: 50,
    maxHeight: 200,
    width: 60,
    speed: 3,
    spawnInterval: 2000,
    lastSpawn: 0
};

// Initialize clouds
function initClouds() {
    clouds = [];
    for (let i = 0; i < 5; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height / 2),
            width: 60 + Math.random() * 40,
            height: 30 + Math.random() * 20,
            speed: 0.5 + Math.random() * 0.5
        });
    }
}

// Draw player (plane)
function drawPlayer() {
    // Plane body
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.ellipse(player.x + 25, player.y, 25, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Plane nose
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.moveTo(player.x + 45, player.y);
    ctx.lineTo(player.x + 55, player.y - 5);
    ctx.lineTo(player.x + 55, player.y + 5);
    ctx.closePath();
    ctx.fill();

    // Wings
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.moveTo(player.x + 15, player.y);
    ctx.lineTo(player.x, player.y - 15);
    ctx.lineTo(player.x + 10, player.y);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(player.x + 15, player.y);
    ctx.lineTo(player.x, player.y + 15);
    ctx.lineTo(player.x + 10, player.y);
    ctx.closePath();
    ctx.fill();

    // Window
    ctx.fillStyle = '#34495e';
    ctx.beginPath();
    ctx.arc(player.x + 20, player.y, 5, 0, Math.PI * 2);
    ctx.fill();
}

// Draw clouds
function drawClouds() {
    clouds.forEach(cloud => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
        ctx.ellipse(cloud.x + cloud.width / 3, cloud.y, cloud.width / 3, cloud.height / 3, 0, 0, Math.PI * 2);
        ctx.ellipse(cloud.x - cloud.width / 3, cloud.y, cloud.width / 3, cloud.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Update clouds
function updateClouds() {
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width + cloud.width;
            cloud.y = Math.random() * (canvas.height / 2);
        }
    });
}

// Create obstacle
function createObstacle() {
    const gap = obstacleSettings.minGap + Math.random() * (obstacleSettings.maxGap - obstacleSettings.minGap);
    const topHeight = obstacleSettings.minHeight + Math.random() * (obstacleSettings.maxHeight - obstacleSettings.minHeight);

    obstacles.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomY: topHeight + gap,
        bottomHeight: canvas.height - (topHeight + gap),
        width: obstacleSettings.width,
        passed: false
    });
}

// Draw obstacles
function drawObstacles() {
    obstacles.forEach(obstacle => {
        // Top obstacle (mountain)
        const gradient1 = ctx.createLinearGradient(obstacle.x, 0, obstacle.x + obstacle.width, 0);
        gradient1.addColorStop(0, '#8B7355');
        gradient1.addColorStop(1, '#654321');

        ctx.fillStyle = gradient1;
        ctx.beginPath();
        ctx.moveTo(obstacle.x, obstacle.topHeight);
        ctx.lineTo(obstacle.x + obstacle.width / 2, 0);
        ctx.lineTo(obstacle.x + obstacle.width, obstacle.topHeight);
        ctx.closePath();
        ctx.fill();

        // Snow cap
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(obstacle.x + obstacle.width / 2, 0);
        ctx.lineTo(obstacle.x + obstacle.width / 2 - 10, 20);
        ctx.lineTo(obstacle.x + obstacle.width / 2 + 10, 20);
        ctx.closePath();
        ctx.fill();

        // Bottom obstacle (mountain)
        const gradient2 = ctx.createLinearGradient(obstacle.x, obstacle.bottomY, obstacle.x + obstacle.width, obstacle.bottomY);
        gradient2.addColorStop(0, '#8B7355');
        gradient2.addColorStop(1, '#654321');

        ctx.fillStyle = gradient2;
        ctx.beginPath();
        ctx.moveTo(obstacle.x, obstacle.bottomY);
        ctx.lineTo(obstacle.x + obstacle.width / 2, canvas.height);
        ctx.lineTo(obstacle.x + obstacle.width, obstacle.bottomY);
        ctx.closePath();
        ctx.fill();
    });
}

// Update obstacles
function updateObstacles(timestamp) {
    // Spawn new obstacles
    if (timestamp - obstacleSettings.lastSpawn > obstacleSettings.spawnInterval) {
        createObstacle();
        obstacleSettings.lastSpawn = timestamp;
    }

    // Move obstacles
    obstacles.forEach((obstacle, index) => {
        obstacle.x -= obstacleSettings.speed;

        // Check if passed
        if (!obstacle.passed && obstacle.x + obstacle.width < player.x) {
            obstacle.passed = true;
            score++;
            document.getElementById('score').textContent = score;
            createStar(obstacle.x + obstacle.width / 2, obstacle.topHeight + (obstacle.bottomY - obstacle.topHeight) / 2);
        }

        // Remove off-screen obstacles
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
        }
    });
}

// Create star
function createStar(x, y) {
    stars.push({ x, y, size: 0, maxSize: 20, growing: true });
}

// Draw stars
function drawStars() {
    stars.forEach(star => {
        ctx.fillStyle = '#f39c12';
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 2;

        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const x = star.x + Math.cos(angle) * star.size;
            const y = star.y + Math.sin(angle) * star.size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);

            const angle2 = (Math.PI * 2 * (i + 0.5)) / 5 - Math.PI / 2;
            const x2 = star.x + Math.cos(angle2) * (star.size / 2);
            const y2 = star.y + Math.sin(angle2) * (star.size / 2);
            ctx.lineTo(x2, y2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    });
}

// Update stars
function updateStars() {
    stars.forEach((star, index) => {
        if (star.growing) {
            star.size += 1;
            if (star.size >= star.maxSize) {
                star.growing = false;
            }
        } else {
            star.size -= 0.5;
            if (star.size <= 0) {
                stars.splice(index, 1);
            }
        }
    });
}

// Create explosion particles
function createExplosion(x, y) {
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            size: Math.random() * 5 + 2,
            life: 1
        });
    }
}

// Draw particles
function drawParticles() {
    particles.forEach(particle => {
        ctx.fillStyle = `rgba(231, 76, 60, ${particle.life})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Update particles
function updateParticles() {
    particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.02;
        particle.size *= 0.98;

        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });
}

// Update player
function updatePlayer() {
    player.dy += player.gravity;
    player.dy = Math.max(Math.min(player.dy, player.maxSpeed), -player.maxSpeed);
    player.y += player.dy;

    // Keep player in bounds
    if (player.y < player.height / 2) {
        player.y = player.height / 2;
        player.dy = 0;
    }
    if (player.y > canvas.height - player.height / 2) {
        player.y = canvas.height - player.height / 2;
        player.dy = 0;
    }
}

// Check collisions
function checkCollisions() {
    for (let obstacle of obstacles) {
        // Check if player is in obstacle's x range
        if (player.x + player.width > obstacle.x &&
            player.x < obstacle.x + obstacle.width) {
            // Check collision with top or bottom
            if (player.y - player.height / 2 < obstacle.topHeight ||
                player.y + player.height / 2 > obstacle.bottomY) {
                return true;
            }
        }
    }
    return false;
}

// Game over
function gameOver() {
    gameState = 'gameOver';
    createExplosion(player.x + player.width / 2, player.y);

    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('skyRacerHighScore', highScore);
        document.getElementById('highScore').textContent = highScore;
    }

    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalHighScore').textContent = highScore;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

// Reset game
function resetGame() {
    player.y = canvas.height / 2;
    player.dy = 0;
    obstacles = [];
    stars = [];
    particles = [];
    score = 0;
    obstacleSettings.lastSpawn = 0;
    document.getElementById('score').textContent = score;
}

// Start game
function startGame() {
    gameState = 'playing';
    resetGame();
    initClouds();
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('pauseScreen').classList.add('hidden');
}

// Pause game
function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        document.getElementById('pauseScreen').classList.remove('hidden');
    } else if (gameState === 'paused') {
        gameState = 'playing';
        document.getElementById('pauseScreen').classList.add('hidden');
    }
}

// Game loop
function gameLoop(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#E8F4F8');
    gradient.addColorStop(1, '#90EE90');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw clouds
    updateClouds();
    drawClouds();

    if (gameState === 'playing') {
        updatePlayer();
        updateObstacles(timestamp);
        updateStars();
        updateParticles();

        // Check collisions
        if (checkCollisions()) {
            gameOver();
        }
    }

    // Always draw game objects
    drawObstacles();
    drawStars();
    drawPlayer();
    drawParticles();

    animationId = requestAnimationFrame(gameLoop);
}

// Keyboard controls
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (e.key === ' ') {
        e.preventDefault();
        if (gameState === 'start') {
            startGame();
        } else if (gameState === 'playing' || gameState === 'paused') {
            togglePause();
        } else if (gameState === 'gameOver') {
            startGame();
        }
    }

    if (gameState === 'playing') {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            player.dy = player.jumpStrength;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            player.dy = -player.jumpStrength;
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Button events
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

// Initialize and start
initClouds();
gameLoop(0);
