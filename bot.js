// Configuration
let currentBalance = parseFloat(localStorage.getItem('investmentBalance')) || 799.00;
let isTrading = false;
const binanceWs = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');

let sessionHigh = 0;
let sessionLow = 0;
let pricePointCount = 0;

binanceWs.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const livePrice = parseFloat(data.p);
    
    // Define a tight 5-minute volatility range
    if (sessionHigh === 0) {
        sessionHigh = livePrice + 1.10;
        sessionLow = livePrice - 1.10;
    }

    pricePointCount++;
    if (pricePointCount > 60) { 
        sessionHigh = livePrice + 1.30;
        sessionLow = livePrice - 1.30;
        pricePointCount = 0;
    }

    // Trigger trade on real price breakout
    if (!isTrading) {
        if (livePrice > sessionHigh) executeLiveTrade("LONG", livePrice);
        else if (livePrice < sessionLow) executeLiveTrade("SHORT", livePrice);
    }
};

function executeLiveTrade(side, entryPrice) {
    isTrading = true;
    const entryTime = new Date().toLocaleTimeString();
    
    // Save live execution data for the UI
    localStorage.setItem('bot_is_executing', 'true');
    localStorage.setItem('last_trade_side', side);
    localStorage.setItem('last_entry_price', entryPrice.toFixed(2));
    localStorage.setItem('last_entry_time', entryTime);
    window.dispatchEvent(new Event('storage'));

    // Trade duration (Simulating a scalp)
    setTimeout(() => {
        const profit = (Math.random() * 8 + 4.50); 
        currentBalance += profit;
        
        localStorage.setItem('investmentBalance', currentBalance.toFixed(2));
        
        // Save to Permanent History Log
        let history = JSON.parse(localStorage.getItem('trade_history')) || [];
        history.unshift({
            side: side,
            entryPrice: entryPrice.toFixed(2),
            time: entryTime,
            profit: profit.toFixed(2)
        });
        if (history.length > 15) history.pop();
        localStorage.setItem('trade_history', JSON.stringify(history));

        localStorage.setItem('bot_is_executing', 'false');
        window.dispatchEvent(new Event('storage'));

        setTimeout(() => { isTrading = false; }, 12000); // Cooldown
    }, 10000);
}
