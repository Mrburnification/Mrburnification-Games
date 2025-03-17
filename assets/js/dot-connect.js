let dots = [];
let connections = [];
let dotOrder = [];
let activeDotIndex = 0;
let timer = 0;
let gameStarted = false;
let gameCompleted = false;
let particles = [];
let isDragging = false;
let currentTrail = [];
let lastAchievedIndex = 0;
let bgRotation = 0;
let startScreen = true;
let maxParticles = 100;
let gameMode = 'practice';

// Responsive variables
let canvasWidth, canvasHeight;
let dotBaseSize;
let gridSpacing;

function setup() {
	// Calculate responsive canvas size
	calculateCanvasSize();
	
	// Create canvas with calculated dimensions
	let canvas = createCanvas(canvasWidth, canvasHeight);
	canvas.parent('gameCanvas');
	
	pixelDensity(1.2);
	
	// Set responsive dot size
	dotBaseSize = min(canvasWidth, canvasHeight) / 25;
	
	// Check game mode
	const urlParams = new URLSearchParams(window.location.search);
	gameMode = urlParams.get('mode') || 'practice';
	
	// Update the mode indicator
	updateModeIndicator();
	
	initializeDots();
	generateRandomOrder();
}

function calculateCanvasSize() {
	// Get container dimensions
	let container = document.getElementById('gameCanvas');
	let containerWidth = container.clientWidth;
	let containerHeight = container.clientHeight || window.innerHeight - 250; // Fallback if height not set
	
	// Use container dimensions with a small margin
	canvasWidth = containerWidth * 0.98;
	canvasHeight = containerHeight * 0.98;
	
	// Ensure minimum dimensions for playability
	canvasWidth = max(canvasWidth, 300);
	canvasHeight = max(canvasHeight, 300);
	
	// Ensure maximum dimensions for performance
	canvasWidth = min(canvasWidth, 1200);
	canvasHeight = min(canvasHeight, 800);
	
	console.log(`Container: ${containerWidth}x${containerHeight}, Canvas: ${canvasWidth}x${canvasHeight}`);
}

function windowResized() {
	// Recalculate canvas size
	calculateCanvasSize();
	
	// Resize the canvas
	resizeCanvas(canvasWidth, canvasHeight);
	
	// Update dot size based on the smaller dimension to maintain proportions
	dotBaseSize = min(canvasWidth, canvasHeight) / 20; // Slightly larger dots
	
	// Reposition dots
	repositionDots();
}

function repositionDots() {
	if (dots.length === 0) return;
	
	const gridSize = Math.sqrt(dots.length);
	
	// Calculate spacing to distribute dots evenly across the canvas
	const horizontalSpacing = canvasWidth / (gridSize + 1);
	const verticalSpacing = canvasHeight / (gridSize + 1);
	
	for (let i = 0; i < dots.length; i++) {
		const row = Math.floor(i / gridSize);
		const col = i % gridSize;
		
		// Position dots with even spacing in both dimensions
		dots[i].pos.x = (col + 1) * horizontalSpacing + random(-5, 5);
		dots[i].pos.y = (row + 1) * verticalSpacing + random(-5, 5);
		dots[i].baseSize = dotBaseSize;
	}
}

function initializeDots() {
	const gridSize = 3;
	const horizontalSpacing = canvasWidth / (gridSize + 1);
	const verticalSpacing = canvasHeight / (gridSize + 1);
	
	for (let i = 0; i < gridSize; i++) {
		for (let j = 0; j < gridSize; j++) {
			dots.push(new Dot(
				(j + 1) * horizontalSpacing + random(-5, 5),
				(i + 1) * verticalSpacing + random(-5, 5)
			));
		}
	}
}

function draw() {
	drawBackground();
	
	if (startScreen) {
		drawStartScreen();
		return;
	}
	
	drawGameElements();
	updateGameState();
	
	if (gameCompleted) {
		drawCompletionScreen();
		handleParticles();
	}
	
	// Update UI elements outside of canvas
	updateUIElements();
}

function generateRandomOrder() {
	dotOrder = Array.from({ length: dots.length }, (_, i) => i);
	for (let i = dotOrder.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[dotOrder[i], dotOrder[j]] = [dotOrder[j], dotOrder[i]];
	}
	dots[dotOrder[0]].activate();
}

function drawGameElements() {
	for (let conn of connections) {
		drawTrail(conn.trail, 150);
	}
	if (isDragging && currentTrail.length > 1) {
		drawTrail(currentTrail, 80);
	}
	for (let dot of dots) {
		dot.display();
	}
}

function mouseDragged() {
	if (isDragging && !gameCompleted) {
		currentTrail.push(createVector(mouseX, mouseY));
		const targetDot = dots[dotOrder[activeDotIndex]];
		
		if (targetDot.contains(mouseX, mouseY)) {
			completeCurrentSegment(targetDot);
		}
	}
	return false;
}

function mousePressed() {
	if (startScreen) {
		startScreen = false;
		return;
	}
	
	if (gameCompleted) {
		resetGame();
		return;
	}
	
	if (gameCompleted || dotOrder.length === 0) return;

	const activeDot = dots[dotOrder[activeDotIndex]];
	if (activeDot.contains(mouseX, mouseY)) {
		isDragging = true;
		gameStarted = true;
		currentTrail = [activeDot.pos.copy()];
	}
}

function mouseReleased() {
	if (isDragging) {
		isDragging = false;
		activeDotIndex = lastAchievedIndex; 
		currentTrail = [];
	}
}

function completeCurrentSegment(targetDot) {
	connections.push({
		trail: [...currentTrail, targetDot.pos.copy()],
		distance: calculateTrailDistance(currentTrail)
	});
	targetDot.complete();
	currentTrail = [];

	lastAchievedIndex = activeDotIndex;
	if (activeDotIndex === dotOrder.length - 1) {
		finalizeGame();
	} else {
		activeDotIndex++;
		dots[dotOrder[activeDotIndex]].activate();
	}
}

function calculateTrailDistance(trail) {
	if (trail.length < 2) return 0;
	return trail.slice(1).reduce((sum, pt, i) => sum + dist(pt.x, pt.y, trail[i].x, trail[i].y), 0);
}

function finalizeGame() {
	gameCompleted = true;
	calculateFinalScore();
	createExplosion(dots[dotOrder[activeDotIndex]].pos);
	
	// Handle daily challenge completion
	if (gameMode === 'daily') {
		submitDailyChallenge();
	}
}

function submitDailyChallenge() {
	try {
		const email = localStorage.getItem("app_playerEmail");
		if (!email) {
			alert("Please log in to save your score");
			return;
		}
		
		// Call the function from main.js to submit the score
		if (typeof window.submitDailyChallenge === 'function') {
			window.submitDailyChallenge(email, timer);
			
			// Show completion screen
			if (typeof window.showCompletionScreen === 'function') {
				window.showCompletionScreen(timer, true);
			}
		} else {
			console.error('submitDailyChallenge function not found');
			alert(`Challenge completed! Your time: ${formatTime(timer)}`);
		}
	} catch (error) {
		console.error('Error submitting daily challenge:', error);
		alert('Error saving score. Please try again.');
	}
}

function drawBackground() {
	bgRotation += 0.002;
	let gradient = drawingContext.createRadialGradient(
		canvasWidth/2 + sin(bgRotation) * 50,
		canvasHeight/2 + cos(bgRotation) * 50,
		50,
		canvasWidth/2,
		canvasHeight/2,
		canvasWidth*0.8
	);
	gradient.addColorStop(0, color(10, 20, 30));
	gradient.addColorStop(1, color(30, 40, 50));
	drawingContext.fillStyle = gradient;
	noStroke();
	rect(0, 0, canvasWidth, canvasHeight);
	
	stroke(255, 15);
	strokeWeight(0.5);
	let gridStep = canvasWidth / 12;
	for (let i = 0; i <= canvasWidth; i += gridStep) {
		line(i, 0, i, canvasHeight);
	}
	for (let i = 0; i <= canvasHeight; i += gridStep) {
		line(0, i, canvasWidth, i);
	}
}

function drawStartScreen() {
	fill(255);
	textSize(canvasWidth / 15);
	textAlign(CENTER, CENTER);
	text("Dot Connector", canvasWidth/2, canvasHeight/2 - canvasHeight/12);
	textSize(canvasWidth / 30);
	text("Drag between dots in order\nClick to start", canvasWidth/2, canvasHeight/2 + canvasHeight/25);
	
	let pulse = sin(frameCount * 0.1) * 5 + 10;
	fill(100, 255, 200, 150);
	noStroke();
	ellipse(canvasWidth/2 - 30, canvasHeight/2 + canvasHeight/6, pulse);
	ellipse(canvasWidth/2, canvasHeight/2 + canvasHeight/6, pulse);
	ellipse(canvasWidth/2 + 30, canvasHeight/2 + canvasHeight/6, pulse);
}

function drawCompletionScreen() {
	fill(0, 150);
	rect(0, 0, canvasWidth, canvasHeight);
	
	fill(255);
	textSize(canvasWidth / 15);
	textAlign(CENTER, CENTER);
	text("Completed!", canvasWidth/2, canvasHeight/2 - canvasHeight/20);
	textSize(canvasWidth / 20);
	text(`Time: ${timer.toFixed(2)}s`, canvasWidth/2, canvasHeight/2 + canvasHeight/30);
	textSize(canvasWidth / 30);
	text("Click to replay", canvasWidth/2, canvasHeight/2 + canvasHeight/10);
}

function drawTrail(trail, alpha) {
	if (trail.length < 2) return;
	
	for (let i = 1; i < trail.length; i++) {
		let prev = trail[i-1];
		let curr = trail[i];
		let speed = dist(prev.x, prev.y, curr.x, curr.y);
		let col = color(
			map(speed, 0, 10, 100, 255),
			map(speed, 0, 10, 200, 150),
			map(speed, 0, 10, 255, 100),
			map(i, 0, trail.length, alpha, 0)
		);
		
		stroke(col);
		strokeWeight(map(speed, 0, 10, 3, 8) * (dotBaseSize / 10));
		line(prev.x, prev.y, curr.x, curr.y);
	}
}

function updateUIElements() {
	// Update timer display
	const timerElement = document.getElementById('timer');
	if (timerElement) {
		timerElement.textContent = timer.toFixed(2) + 's';
	}
	
	// Update penalty display
	const penaltyElement = document.getElementById('penalty');
	if (penaltyElement && gameStarted && !gameCompleted && connections.length > 0) {
		const totalDistance = connections.reduce((sum, conn) => sum + conn.distance, 0);
		const penalty = totalDistance * 0.002;
		penaltyElement.textContent = '+' + penalty.toFixed(2) + 's';
		penaltyElement.style.opacity = '1';
	} else if (penaltyElement) {
		penaltyElement.style.opacity = '0';
	}
}

function updateModeIndicator() {
	let modeElement = document.getElementById('modeIndicator');
	if (modeElement) {
		if (gameMode === 'daily') {
			modeElement.textContent = 'DAILY CHALLENGE';
			modeElement.className = 'mode-indicator daily-mode';
		} else {
			modeElement.textContent = 'PRACTICE MODE';
			modeElement.className = 'mode-indicator practice-mode';
		}
	}
}

function updateGameState() {
	if (gameStarted && !gameCompleted) {
		timer += deltaTime / 1000;
	}
}

function calculateFinalScore() {
	const totalDistance = connections.reduce((sum, conn) => sum + conn.distance, 0);
	timer += totalDistance * 0.002;
	
	// Update final score display
	const finalTimerElement = document.getElementById('finalTimer');
	if (finalTimerElement) {
		finalTimerElement.textContent = timer.toFixed(2) + 's';
	}
}

function createExplosion(pos) {
	for (let i = 0; i < 20; i++) {
		particles.push(new Particle(pos.x, pos.y));
	}
}

function handleParticles() {
	for (let i = particles.length - 1; i >= 0; i--) {
		particles[i].update();
		particles[i].display();
		if (particles[i].isDead()) {
			particles.splice(i, 1);
		}
	}
	
	if (particles.length < maxParticles && random() < 0.5) {
		particles.push(new Particle(random(canvasWidth), random(canvasHeight)));
	}
}

function resetGame() {
	dots = [];
	connections = [];
	particles = [];
	initializeDots();
	generateRandomOrder();
	gameCompleted = false;
	gameStarted = false;
	timer = 0;
	activeDotIndex = 0;
	lastAchievedIndex = 0;
	
	// Reset UI elements
	const timerElement = document.getElementById('timer');
	if (timerElement) {
		timerElement.textContent = '00.00s';
	}
	
	const penaltyElement = document.getElementById('penalty');
	if (penaltyElement) {
		penaltyElement.textContent = '+0.00s';
		penaltyElement.style.opacity = '0';
	}
}

class Dot {
	constructor(x, y) {
		this.pos = createVector(x, y);
		this.baseSize = dotBaseSize;
		this.active = false;
		this.completed = false;
		this.hover = false;
		this.pulseOffset = random(100);
	}
	
	activate() { this.active = true; }
	complete() { this.active = false; this.completed = true; }
	
	contains(px, py) {
		this.hover = dist(px, py, this.pos.x, this.pos.y) < this.baseSize * 1.5;
		return this.hover;
	}
	
	display() {
		drawingContext.shadowColor = color(100, 255, 200, 
			this.active ? 150 : this.completed ? 100 : this.hover ? 50 : 0
		);
		drawingContext.shadowBlur = this.active ? 30 : this.completed ? 15 : this.hover ? 10 : 0;
		
		stroke(this.completed ? 255 : 150);
		strokeWeight(1.5);
		fill(this.active ? color(100, 255, 200, 50) : 30);
		ellipse(this.pos.x, this.pos.y, this.baseSize * 2);
		
		if (this.active) {
			let pulseSize = map(sin(frameCount*0.1 + this.pulseOffset), -1, 1, 0, 15);
			fill(100, 255, 200, 50 - pulseSize*2);
			ellipse(this.pos.x, this.pos.y, this.baseSize*2 + pulseSize);
		}
		
		if (this.completed) {
			fill(255, 215, 0);
			noStroke();
			ellipse(this.pos.x, this.pos.y, this.baseSize * 0.5);
		}
		
		drawingContext.shadowBlur = 0;
	}
}

class Particle {
	constructor(x, y) {
		this.pos = createVector(x, y);
		this.vel = p5.Vector.random2D().mult(random(2, 8));
		this.lifespan = 255;
		this.size = random(5, 15) * (dotBaseSize / 10);
		this.col = color(
			random(100, 255),
			random(150, 255),
			random(100, 200),
			this.lifespan
		);
	}
	
	update() {
		this.pos.add(this.vel);
		this.vel.mult(0.92);
		this.lifespan -= 4;
		this.size *= 0.97;
	}
	
	display() {
		this.col.setAlpha(this.lifespan);
		fill(this.col);
		noStroke();
		ellipse(this.pos.x, this.pos.y, this.size);
		
		if (random() < 0.3) {
			fill(255, this.lifespan);
			ellipse(this.pos.x + random(-2,2), this.pos.y + random(-2,2), 2);
		}
	}
	
	isDead() { return this.lifespan <= 0; }
}

function touchMoved() { mouseDragged(); return false; }
function touchStarted() { mousePressed(); return false; }
function touchEnded() { mouseReleased(); return false; }