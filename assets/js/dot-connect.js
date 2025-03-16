// Game variables
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

function setup() {
  // Create canvas inside the container
  let canvas = createCanvas(500, 500);
  canvas.parent('game-canvas-container');
  pixelDensity(2);
  
  // Check game mode
  const urlParams = new URLSearchParams(window.location.search);
  gameMode = urlParams.get('mode') || 'practice';
  
  initializeDots();
  generateRandomOrder();
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

function initializeDots() {
  const gridSize = 3;
  const spacing = width / (gridSize + 1);
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      dots.push(new Dot(
        (j + 1) * spacing + random(-5, 5),
        (i + 1) * spacing + random(-5, 5)
      ));
    }
  }
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
  // Get user email
  const user = window.auth.currentUser;
  let email;
  
  if (user) {
    email = user.email;
  } else {
    email = localStorage.getItem("app_playerEmail");
    if (!email) {
      alert("Please log in to save your score");
      return;
    }
  }
  
  // Submit score to Firebase
  const today = new Date().toDateString();
  const docRef = window.db.collection("dailyChallenges").doc(`${email}_${today}`);
  
  docRef.set({
    email,
    score: timer,
    timestamp: new Date().toISOString()
  }).then(() => {
    console.log("Daily challenge score submitted");
    
    // Update user stats
    const userRef = window.db.collection("users").doc(email);
    userRef.get().then((doc) => {
      if (doc.exists) {
        const userData = doc.data();
        const gamesPlayed = userData.gamesPlayed || 0;
        const bestScore = userData.bestScore || Infinity;
        
        userRef.set({
          gamesPlayed: gamesPlayed + 1,
          bestScore: timer < bestScore ? timer : bestScore,
          lastGamePlayed: new Date().toISOString()
        }, { merge: true });
      }
    });
  }).catch((error) => {
    console.error("Error submitting score:", error);
  });
}

function drawBackground() {
  bgRotation += 0.002;
  let gradient = drawingContext.createRadialGradient(
    width/2 + sin(bgRotation) * 50,
    height/2 + cos(bgRotation) * 50,
    50,
    width/2,
    height/2,
    width*0.8
  );
  gradient.addColorStop(0, color(10, 20, 30));
  gradient.addColorStop(1, color(30, 40, 50));
  drawingContext.fillStyle = gradient;
  noStroke();
  rect(0, 0, width, height);
  
  stroke(255, 15);
  strokeWeight(0.5);
  for (let i = 0; i <= width; i += 40) {
    line(i, 0, i, height);
    line(0, i, width, i);
  }
}

function drawStartScreen() {
  fill(255);
  textSize(32);
  textAlign(CENTER, CENTER);
  text("Dot Connector", width/2, height/2 - 40);
  textSize(16);
  text("Drag between dots in order\nClick to start", width/2, height/2 + 20);
  
  let pulse = sin(frameCount * 0.1) * 5 + 10;
  fill(100, 255, 200, 150);
  noStroke();
  ellipse(width/2 - 30, height/2 + 80, pulse);
  ellipse(width/2, height/2 + 80, pulse);
  ellipse(width/2 + 30, height/2 + 80, pulse);
}

function drawCompletionScreen() {
  fill(0, 150);
  rect(0, 0, width, height);
  
  fill(255);
  textSize(32);
  text("Completed!", width/2, height/2 - 30);
  textSize(24);
  text(`Time: ${timer.toFixed(2)}s`, width/2, height/2 + 10);
  textSize(16);
  text("Click to replay", width/2, height/2 + 50);
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
    strokeWeight(map(speed, 0, 10, 3, 8));
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
    particles.push(new Particle(random(width), random(height)));
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
    this.baseSize = 20;
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
      ellipse(this.pos.x, this.pos.y, 10);
    }
    
    drawingContext.shadowBlur = 0;
  }
}

class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(2, 8));
    this.lifespan = 255;
    this.size = random(5, 15);
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