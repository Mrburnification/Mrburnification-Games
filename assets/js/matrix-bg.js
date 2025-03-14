document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.createElement('canvas');
    const matrixBg = document.getElementById('matrix-bg');
    matrixBg.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    // Make canvas full screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Characters to display
    const chars = "01";
    
    // Font size and columns
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    
    // Array to track the y position of each column
    const drops = [];
    
    // Initialize all columns to start at random positions
    for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -100;
    }
    
    // Drawing function
    function draw() {
        // Set semi-transparent black background to create trail effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set text color and font
        ctx.fillStyle = '#0f0'; // Matrix green
        ctx.font = `${fontSize}px monospace`;
        
        // Draw characters
        for (let i = 0; i < drops.length; i++) {
            // Random character
            const char = chars.charAt(Math.floor(Math.random() * chars.length));
            
            // Draw character
            ctx.fillText(char, i * fontSize, drops[i] * fontSize);
            
            // Move drop down
            drops[i]++;
            
            // Reset drop to top with random delay when it reaches bottom
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
        }
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Recalculate columns
        const newColumns = Math.floor(canvas.width / fontSize);
        
        // Adjust drops array
        if (newColumns > columns) {
            // Add new columns
            for (let i = columns; i < newColumns; i++) {
                drops[i] = Math.random() * -100;
            }
        } else {
            // Remove excess columns
            drops.length = newColumns;
        }
    });
    
    // Run animation
    setInterval(draw, 33); // ~30fps
}); 