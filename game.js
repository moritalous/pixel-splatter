// Game constants
const TILE_SIZE = 16;
const GRID_WIDTH = 32;
const GRID_HEIGHT = 30;
const CANVAS_WIDTH = GRID_WIDTH * TILE_SIZE;
const CANVAS_HEIGHT = GRID_HEIGHT * TILE_SIZE;
const PLAYER_SPEED = 2;
const PAINT_COOLDOWN = 15;
const GAME_DURATION = 60; // seconds

// Game variables
let canvas, ctx;
let gameGrid = [];
let player = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    width: TILE_SIZE,
    height: TILE_SIZE,
    speed: PLAYER_SPEED,
    team: 1, // 1 = blue, 2 = red
    paintCooldown: 0,
    direction: 0, // 0 = down, 1 = left, 2 = right, 3 = up
    frameCount: 0
};

let enemies = [];
let gameTime = GAME_DURATION;
let gameInterval;
let gameActive = false;

// Keyboard controls
const keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    space: false
};

// Initialize the game
window.onload = function() {
    canvas = document.getElementById('gameCanvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    ctx = canvas.getContext('2d');
    
    // Set pixelated rendering
    ctx.imageSmoothingEnabled = false;
    
    initGame();
    
    // Start game loop
    gameInterval = setInterval(gameLoop, 1000 / 60);
    
    // Start timer
    setInterval(updateTimer, 1000);
    
    // Event listeners for keyboard
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
};

// Initialize game state
function initGame() {
    gameActive = true;
    
    // Initialize grid
    for (let y = 0; y < GRID_HEIGHT; y++) {
        gameGrid[y] = [];
        for (let x = 0; x < GRID_WIDTH; x++) {
            gameGrid[y][x] = 0; // 0 = empty, 1 = team1, 2 = team2
        }
    }
    
    // Create some enemy AI players
    for (let i = 0; i < 3; i++) {
        enemies.push({
            x: Math.random() * (CANVAS_WIDTH - TILE_SIZE),
            y: Math.random() * (CANVAS_HEIGHT - TILE_SIZE),
            width: TILE_SIZE,
            height: TILE_SIZE,
            speed: PLAYER_SPEED * 0.8,
            team: 2, // enemy team
            paintCooldown: 0,
            direction: Math.floor(Math.random() * 4),
            frameCount: Math.floor(Math.random() * 60),
            targetX: 0,
            targetY: 0,
            thinkTime: 0
        });
    }
}

// Main game loop
function gameLoop() {
    update();
    render();
}

// Update game state
function update() {
    if (!gameActive) return;
    
    // Update player
    updatePlayer();
    
    // Update enemies
    updateEnemies();
    
    // Update scores
    updateScores();
}

// Update player position and actions
function updatePlayer() {
    // Movement
    if (keys.up || keys.down || keys.left || keys.right) {
        let newX = player.x;
        let newY = player.y;
        
        if (keys.up) {
            newY -= player.speed;
            player.direction = 3;
        }
        if (keys.down) {
            newY += player.speed;
            player.direction = 0;
        }
        if (keys.left) {
            newX -= player.speed;
            player.direction = 1;
        }
        if (keys.right) {
            newX += player.speed;
            player.direction = 2;
        }
        
        // Boundary check
        if (newX >= 0 && newX <= CANVAS_WIDTH - player.width) {
            player.x = newX;
        }
        if (newY >= 0 && newY <= CANVAS_HEIGHT - player.height) {
            player.y = newY;
        }
    }
    
    // Painting
    if (keys.space && player.paintCooldown <= 0) {
        paintArea(player);
        player.paintCooldown = PAINT_COOLDOWN;
    }
    
    if (player.paintCooldown > 0) {
        player.paintCooldown--;
    }
    
    player.frameCount = (player.frameCount + 1) % 60;
}

// Update enemy AI
function updateEnemies() {
    enemies.forEach(enemy => {
        // AI thinking
        if (enemy.thinkTime <= 0) {
            // Choose a new target
            enemy.targetX = Math.random() * CANVAS_WIDTH;
            enemy.targetY = Math.random() * CANVAS_HEIGHT;
            enemy.thinkTime = Math.random() * 120 + 60;
        }
        
        // Move towards target
        const dx = enemy.targetX - enemy.x;
        const dy = enemy.targetY - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 5) {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
            
            // Set direction based on movement
            if (Math.abs(dx) > Math.abs(dy)) {
                enemy.direction = dx > 0 ? 2 : 1;
            } else {
                enemy.direction = dy > 0 ? 0 : 3;
            }
        }
        
        // Boundary check
        enemy.x = Math.max(0, Math.min(CANVAS_WIDTH - enemy.width, enemy.x));
        enemy.y = Math.max(0, Math.min(CANVAS_HEIGHT - enemy.height, enemy.y));
        
        // Painting
        if (enemy.paintCooldown <= 0) {
            paintArea(enemy);
            enemy.paintCooldown = PAINT_COOLDOWN + Math.random() * 30;
        }
        
        if (enemy.paintCooldown > 0) {
            enemy.paintCooldown--;
        }
        
        enemy.thinkTime--;
        enemy.frameCount = (enemy.frameCount + 1) % 60;
    });
}

// Paint the area around a character
function paintArea(character) {
    const gridX = Math.floor(character.x / TILE_SIZE);
    const gridY = Math.floor(character.y / TILE_SIZE);
    
    // Paint in a small area around the character
    for (let y = -1; y <= 1; y++) {
        for (let x = -1; x <= 1; x++) {
            const tileX = gridX + x;
            const tileY = gridY + y;
            
            if (tileX >= 0 && tileX < GRID_WIDTH && tileY >= 0 && tileY < GRID_HEIGHT) {
                gameGrid[tileY][tileX] = character.team;
            }
        }
    }
}

// Update team scores
function updateScores() {
    let team1Tiles = 0;
    let team2Tiles = 0;
    let totalTiles = GRID_WIDTH * GRID_HEIGHT;
    
    // Count tiles
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (gameGrid[y][x] === 1) team1Tiles++;
            else if (gameGrid[y][x] === 2) team2Tiles++;
        }
    }
    
    // Update score display
    const team1Percent = Math.floor((team1Tiles / totalTiles) * 100);
    const team2Percent = Math.floor((team2Tiles / totalTiles) * 100);
    
    document.getElementById('team1-score').textContent = `Team 1: ${team1Percent}%`;
    document.getElementById('team2-score').textContent = `Team 2: ${team2Percent}%`;
}

// Update game timer
function updateTimer() {
    if (!gameActive) return;
    
    gameTime--;
    document.getElementById('game-timer').textContent = `Time: ${gameTime}`;
    
    if (gameTime <= 0) {
        endGame();
    }
}

// End the game
function endGame() {
    gameActive = false;
    
    // Get final scores
    let team1Tiles = 0;
    let team2Tiles = 0;
    let totalTiles = GRID_WIDTH * GRID_HEIGHT;
    
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (gameGrid[y][x] === 1) team1Tiles++;
            else if (gameGrid[y][x] === 2) team2Tiles++;
        }
    }
    
    const team1Percent = Math.floor((team1Tiles / totalTiles) * 100);
    const team2Percent = Math.floor((team2Tiles / totalTiles) * 100);
    
    // Determine winner
    let winner;
    if (team1Percent > team2Percent) {
        winner = "Team 1 (Blue)";
    } else if (team2Percent > team1Percent) {
        winner = "Team 2 (Red)";
    } else {
        winner = "It's a tie!";
    }
    
    // Show game over message
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#fff';
    ctx.font = '24px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    ctx.fillText(`${winner} wins!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.fillText(`Blue: ${team1Percent}% - Red: ${team2Percent}%`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    ctx.fillText('Press SPACE to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
    
    // Allow restart
    window.addEventListener('keydown', function restartHandler(e) {
        if (e.code === 'Space') {
            window.removeEventListener('keydown', restartHandler);
            resetGame();
        }
    });
}

// Reset the game
function resetGame() {
    gameTime = GAME_DURATION;
    player.x = CANVAS_WIDTH / 2;
    player.y = CANVAS_HEIGHT / 2;
    enemies = [];
    initGame();
}

// Render the game
function render() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw grid
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (gameGrid[y][x] !== 0) {
                ctx.fillStyle = gameGrid[y][x] === 1 ? '#5bf' : '#f55';
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }
    
    // Draw grid lines (for NES style)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= GRID_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * TILE_SIZE, 0);
        ctx.lineTo(x * TILE_SIZE, CANVAS_HEIGHT);
        ctx.stroke();
    }
    
    for (let y = 0; y <= GRID_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * TILE_SIZE);
        ctx.lineTo(CANVAS_WIDTH, y * TILE_SIZE);
        ctx.stroke();
    }
    
    // Draw player
    drawCharacter(player);
    
    // Draw enemies
    enemies.forEach(enemy => {
        drawCharacter(enemy);
    });
}

// Draw a character (player or enemy)
function drawCharacter(character) {
    const color = character.team === 1 ? '#5bf' : '#f55';
    const x = Math.floor(character.x);
    const y = Math.floor(character.y);
    
    // Body
    ctx.fillStyle = color;
    ctx.fillRect(x + 2, y + 2, 12, 12);
    
    // Eyes
    ctx.fillStyle = '#fff';
    
    // Direction-based eyes
    if (character.direction === 0) { // Down
        ctx.fillRect(x + 3, y + 6, 3, 3);
        ctx.fillRect(x + 10, y + 6, 3, 3);
    } else if (character.direction === 1) { // Left
        ctx.fillRect(x + 2, y + 6, 3, 3);
        ctx.fillRect(x + 2, y + 10, 3, 3);
    } else if (character.direction === 2) { // Right
        ctx.fillRect(x + 11, y + 6, 3, 3);
        ctx.fillRect(x + 11, y + 10, 3, 3);
    } else { // Up
        ctx.fillRect(x + 3, y + 3, 3, 3);
        ctx.fillRect(x + 10, y + 3, 3, 3);
    }
    
    // Animation - bob up and down
    const bobOffset = Math.sin(character.frameCount * 0.1) * 2;
    
    // Paint tank on back
    ctx.fillStyle = color;
    ctx.fillRect(x + 4, y + 8 + bobOffset, 8, 6);
    
    // Paint nozzle
    if (character.paintCooldown <= 0) {
        ctx.fillStyle = '#fff';
    } else {
        ctx.fillStyle = '#999';
    }
    
    // Direction-based nozzle
    if (character.direction === 0) { // Down
        ctx.fillRect(x + 7, y + 14, 2, 4);
    } else if (character.direction === 1) { // Left
        ctx.fillRect(x - 2, y + 7, 4, 2);
    } else if (character.direction === 2) { // Right
        ctx.fillRect(x + 14, y + 7, 4, 2);
    } else { // Up
        ctx.fillRect(x + 7, y - 2, 2, 4);
    }
}

// Handle keydown events
function handleKeyDown(e) {
    switch(e.code) {
        case 'ArrowUp':
        case 'KeyW':
            keys.up = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            keys.down = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            keys.left = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            keys.right = true;
            break;
        case 'Space':
            keys.space = true;
            break;
    }
}

// Handle keyup events
function handleKeyUp(e) {
    switch(e.code) {
        case 'ArrowUp':
        case 'KeyW':
            keys.up = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            keys.down = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            keys.left = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            keys.right = false;
            break;
        case 'Space':
            keys.space = false;
            break;
    }
}
