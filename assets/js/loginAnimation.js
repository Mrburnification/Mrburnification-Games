const sketch = (p) => {
    let boxes = [];
    let titletext = [];
    let titleYPosition;

    p.setup = () => {
        let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvas.parent('animation-container');
        
        // Calculate title position based on login container
        titleYPosition = p.height/2 - 100;

        // Create boxes with positions relative to login container
        const boxPositions = [
            [p.width/2 - 200, -100], [p.width/2 + 200, -150],
            [p.width/2 - 300, -200], [p.width/2 + 300, -250],
            [p.width/2 - 150, -300], [p.width/2 + 150, -350]
        ];

        boxPositions.forEach(pos => {
            boxes.push(new CustomBox(pos[0], pos[1], 60, randomBrightColor()));
        });
    };

    p.draw = () => {
        p.clear();
        
        // Draw boxes
        boxes.forEach(box => {
            box.update();
            box.display();
        });

        // Draw title with dynamic shadow
        titletext.forEach(text => {
            text.fadedisplay();
            // Add pulsing shadow effect
            p.drawingContext.shadowColor = p.color(255, 255, 255, 50);
            p.drawingContext.shadowBlur = 20 * p.sin(p.frameCount * 0.05);
        });
    };

    function randomBrightColor() {
        p.colorMode(p.HSB, 360, 100, 100);
        let col = p.color(p.random(360), 80, 90);
        p.colorMode(p.RGB);
        return col;
    }

    class writeWord {
        constructor(word, x, y, size, spd) {
            this.word = word;
            this.x = x;
            this.y = y;
            this.size = size;
            this.spd = spd;
            this.opacity = 0;
            this.colour = p.color(255, 255, 255);
        }

        fadedisplay() {
            p.textSize(this.size);
            p.textFont('Impact');
            p.fill(p.red(this.colour), p.green(this.colour), p.blue(this.colour), this.opacity);
            p.stroke(0, this.opacity);
            p.strokeWeight(2);
            p.textAlign(p.CENTER, p.CENTER);
            
            // Gradient fill effect
            let gradient = p.drawingContext.createLinearGradient(
                this.x - p.textWidth(this.word)/2, 
                this.y - this.size/2, 
                this.x + p.textWidth(this.word)/2, 
                this.y + this.size/2
            );
            gradient.addColorStop(0, `hsl(${p.frameCount % 360}, 100%, 70%)`);
            gradient.addColorStop(1, `hsl(${(p.frameCount + 180) % 360}, 100%, 70%)`);
            
            p.drawingContext.fillStyle = gradient;
            p.text(this.word, this.x, this.y);
            
            this.opacity = p.min(this.opacity + this.spd, 255);
        }
    }

    class CustomBox {
        constructor(x, y, s, col) {
            this.x = x;
            this.y = y;
            this.s = s;
            this.col = col;
            this.speed = p.random(1, 8);
            this.rotation = p.random(p.TWO_PI);
            this.spin = p.random(-0.05, 0.05);
        }

        update() {
            this.y += this.speed;
            this.speed += 0.1;
            this.rotation += this.spin;
            
            // Reset position when boxes fall below
            if (this.y > p.height + this.s) {
                this.y = -this.s;
                this.x = p.random(p.width);
                this.speed = p.random(3, 8);
            }
        }

        display() {
            p.push();
            p.translate(this.x, this.y);
            p.rotate(this.rotation);
            
            // Metallic effect
            p.fill(this.col);
            p.stroke(0);
            p.strokeWeight(2);
            p.rect(0, 0, this.s, this.s, 10);
            
            // Shine effect
            p.noStroke();
            p.fill(255, 150);
            p.rect(-this.s/4, -this.s/4, this.s/2, this.s/2, 5);
            
            p.pop();
        }
    }

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    };

    p.mousePressed = () => {
        boxes.forEach(box => {
            if (p.dist(p.mouseX, p.mouseY, box.x, box.y) < box.s/2) {
                box.speed = p.random(-15, -5);
                box.spin = p.random(-0.2, 0.2);
            }
        });
    };
};

new p5(sketch);