// Configuration
let currentBalance = parseFloat(localStorage.getItem('investmentBalance')) || 799.00;
let priceBuffer = [];
const BUFFER_SIZE = 20; 
let isTrading = false;

// 1. Establish real-time connection to Binance
const binanceWs = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');

binanceWs.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const livePrice = parseFloat(data.p);
    
    // Save live price to trend buffer
    priceBuffer.push(livePrice);
    if (priceBuffer.length > BUFFER_SIZE) priceBuffer.shift();

    // 2. Strategy Logic: Only trade on a real price breakout
    if (!isTrading && priceBuffer.length === BUFFER_SIZE) {
        const avgPrice = priceBuffer.reduce((a, b) => a + b) / BUFFER_SIZE;
        const deviation = Math.abs(livePrice - avgPrice);

        // If price moves $3.00 away from average, take a trade
        if (deviation > 3.00) {
            const side = livePrice > avgPrice ? "LONG" : "SHORT";
            executeLiveTrade(side, livePrice);
        }
    }
};

// 3. Execution Function with Permanent History
function executeLiveTrade(side, entryPrice) {
    isTrading = true;
    const entryTime = new Date().toLocaleTimeString();
    
    // Setup temporary execution state for UI indicators
    localStorage.setItem('bot_is_executing', 'true');
    localStorage.setItem('last_trade_side', side);
    localStorage.setItem('last_entry_price', entryPrice.toFixed(2));
    localStorage.setItem('last_entry_time', entryTime);
    window.dispatchEvent(new Event('storage'));

    console.log(`Bot: Entered ${side} at $${entryPrice}`);

    // Hold trade for a "trend ride" (8-15 seconds)
    const holdTime = Math.random() * 7000 + 8000;

    setTimeout(() => {
        // Calculate Professional Profit (simulating 20x leverage capture)
        const profit = (Math.random() * 12 + 5.50); 
        
        // Update Local Balance
        currentBalance += profit;
        localStorage.setItem('investmentBalance', currentBalance.toFixed(2));
        
        // --- PERMANENT HISTORY LOGIC ---
        // Get existing history from memory, or start a new list if empty
        let tradeHistory = JSON.parse(localStorage.getItem('trade_history')) || [];
        
        // Create the new trade record
        const newTrade = {
            side: side,
            entryPrice: entryPrice.toFixed(2),
            time: entryTime,
            profit: profit.toFixed(2),
            timestamp: Date.now()
        };

        // Add to the front of the list and keep only the last 20 trades
        tradeHistory.unshift(newTrade); 
        if (tradeHistory.length > 20) tradeHistory.pop();

        // Save the whole list back to permanent memory
        localStorage.setItem('trade_history', JSON.stringify(tradeHistory));
        // ------------------------------------------

        // Reset execution state
        localStorage.setItem('bot_is_executing', 'false');
        localStorage.setItem('last_profit', profit.toFixed(2));
        
        console.log(`Bot: Closed ${side}. Profit: +$${profit.toFixed(2)}`);
        
        // Signal Dashboard and Market pages to update UI
        window.dispatchEvent(new Event('storage'));

        // Cooldown period (20 seconds) before bot scans for next trade
        setTimeout(() => { isTrading = false; }, 20000);
    }, holdTime);
}
