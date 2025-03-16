document.addEventListener('DOMContentLoaded', function() {
    // Only initialize matrix on specific pages
    const currentPage = window.location.pathname;
    const matrixPages = [
        '/pages/menu.html',
        '/pages/profile.html',
        '/pages/analytics.html'
    ];
    
    // Check if we should show matrix on this page
    const shouldShowMatrix = matrixPages.some(page => currentPage.endsWith(page));
    if (!shouldShowMatrix) return;
    
    const canvas = document.createElement('canvas');
    const matrixBg = document.getElementById('matrix-bg');
    
    if (!matrixBg) return;
    
    matrixBg.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    // Make canvas full viewport size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Characters to use
    const chars = '01'.split('');
    
    // Column settings
    const fontSize = 14;
    let columns = Math.floor(canvas.width / fontSize);
    let drops = [];
    
    // Initialize drops
    for (let i = 0; i < columns; i++) {
        drops[i] = Math.floor(Math.random() * -canvas.height / fontSize);
    }
    
    // Drawing function
    function draw() {
        // Semi-transparent black to create fade effect - reduced opacity
        ctx.fillStyle = 'rgba(10, 10, 15, 0.03)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Reduced opacity for the characters
        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.font = fontSize + 'px monospace';
        
        for (let i = 0; i < drops.length; i++) {
            // Random character
            const char = chars[Math.floor(Math.random() * chars.length)];
            
            // Draw the character
            ctx.fillText(char, i * fontSize, drops[i] * fontSize);
            
            // Move drop down
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Adjust columns
        const newColumns = Math.floor(canvas.width / fontSize);
        
        if (newColumns > columns) {
            // Add more columns
            for (let i = columns; i < newColumns; i++) {
                drops[i] = Math.floor(Math.random() * -canvas.height / fontSize);
            }
        } else {
            // Remove excess columns
            drops.length = newColumns;
        }
        
        columns = newColumns;
    });
    
    // Run animation
    setInterval(draw, 33); // ~30fps
}); 