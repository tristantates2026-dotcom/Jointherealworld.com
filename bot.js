// Global balance initialization
let currentBalance = parseFloat(localStorage.getItem('investmentBalance')) || 799.00;

function runBackgroundBot() {
    // Check if a trade is already in progress to avoid overlapping
    if (localStorage.getItem('bot_is_executing') === 'true') return;

    // Simulate market analysis
    console.log("AI Bot: Scanning for volatility breakout...");

    // Set execution flag
    localStorage.setItem('bot_is_executing', 'true');

    // Random trade duration (5-10 seconds)
    const tradeDuration = Math.random() * 5000 + 5000;

    setTimeout(() => {
        // Professional profit calculation (simulating 20x leverage)
        const profit = (Math.random() * 15 + 5.20); 
        
        // Update local storage balance
        currentBalance += profit;
        localStorage.setItem('investmentBalance', currentBalance.toFixed(2));
        
        // Reset execution flag
        localStorage.setItem('bot_is_executing', 'false');
        
        console.log(`AI Bot: Trade Closed. Profit secured: +$${profit.toFixed(2)}`);
        
        // Broadcast an event so open pages can update their UI immediately
        window.dispatchEvent(new Event('storage'));
    }, tradeDuration);
}

// Start the bot loop (Attempts a trade every 15 seconds)
setInterval(runBackgroundBot, 15000);

// Initial run on load
runBackgroundBot();
