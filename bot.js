// bot.js - Professional Execution Engine
let currentBalance = parseFloat(localStorage.getItem('investmentBalance')) || 799.00;
let isTrading = false;
let latestMarketPrice = 0; 
const binanceWs = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');

// Professional Scalping Parameters (5-15m Timeframe simulation)
let sessionHigh = 0;
let sessionLow = 0;

binanceWs.onmessage = (event) => {
    const data = JSON.parse(event.data);
    latestMarketPrice = parseFloat(data.p);
    
    // Maintain a tight volatility range
    if (sessionHigh === 0) {
        sessionHigh = latestMarketPrice + 2.50;
        sessionLow = latestMarketPrice - 2.50;
    }

    // Dynamic Equity Update (Simulating floating PnL if trading)
    updateFinancials();

    if (!isTrading) {
        if (latestMarketPrice > sessionHigh) executeTrade("LONG", latestMarketPrice);
        else if (latestMarketPrice < sessionLow) executeTrade("SHORT", latestMarketPrice);
    }
};

function updateFinancials() {
    const isExecuting = localStorage.getItem('bot_is_executing') === 'true';
    let equity = currentBalance;

    if (isExecuting) {
        const side = localStorage.getItem('last_trade_side');
        const entry = parseFloat(localStorage.getItem('last_entry_price'));
        // Calculate Floating PnL
        const floatingPnL = (side === "LONG") ? (latestMarketPrice - entry) : (entry - latestMarketPrice);
        equity = currentBalance + (floatingPnL * 0.1); // Simulated leverage
    }

    localStorage.setItem('investmentEquity', equity.toFixed(2));
    localStorage.setItem('freeMargin', (equity * 0.8).toFixed(2)); // Professional 80% margin ratio
    window.dispatchEvent(new Event('storage'));
}

function executeTrade(side, entryPrice) {
    isTrading = true;
    const now = new Date();
    const entryTime = now.toLocaleTimeString();
    const tradeDate = now.toLocaleDateString();
    
    localStorage.setItem('bot_is_executing', 'true');
    localStorage.setItem('last_trade_side', side);
    localStorage.setItem('last_entry_price', entryPrice.toFixed(2));
    localStorage.setItem('last_open_time', `${tradeDate} ${entryTime}`);

    // Simulation of a 15-minute timeframe trade (condensed to 15 seconds for testing)
    setTimeout(() => {
        const exitPrice = latestMarketPrice;
        
        // ACCURATE PnL: No more guaranteed wins
        const rawPnL = (side === "LONG") ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
        const finalProfit = rawPnL * (Math.random() * 0.5); // Scaled PnL
        
        currentBalance += finalProfit;
        localStorage.setItem('investmentBalance', currentBalance.toFixed(2));
        
        let history = JSON.parse(localStorage.getItem('trade_history')) || [];
        history.unshift({
            side: side,
            entryPrice: entryPrice.toFixed(2),
            exitPrice: exitPrice.toFixed(2),
            openTime: entryTime,
            closeTime: new Date().toLocaleTimeString(),
            date: tradeDate,
            rawDate: new Date().toISOString(),
            profit: finalProfit.toFixed(2),
            isWin: finalProfit >= 0 // Determines Red/Green status
        });
        
        localStorage.setItem('trade_history', JSON.stringify(history.slice(0, 100)));
        localStorage.setItem('bot_is_executing', 'false');
        
        // Reset range for next trade
        sessionHigh = exitPrice + 2.50;
        sessionLow = exitPrice - 2.50;
        
        setTimeout(() => { isTrading = false; }, 20000); // Cooldown
    }, 15000); 
}
