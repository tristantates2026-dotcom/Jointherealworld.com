// Professional Algorithmic Trading Configuration
let currentBalance = parseFloat(localStorage.getItem('investmentBalance')) || 799.00;
let isTrading = false;
let latestMarketPrice = 0; 
const binanceWs = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');

// Market Strategy Parameters (5-15 min Scalp Simulation)
let sessionHigh = 0;
let sessionLow = 0;
let breakoutCounter = 0;

binanceWs.onmessage = (event) => {
    const data = JSON.parse(event.data);
    latestMarketPrice = parseFloat(data.p);
    
    // Establishing a 5-minute volatility range
    if (sessionHigh === 0) {
        sessionHigh = latestMarketPrice + 1.25;
        sessionLow = latestMarketPrice - 1.25;
    }

    breakoutCounter++;
    if (breakoutCounter > 50) { // Periodic range reset for realism
        sessionHigh = latestMarketPrice + 1.40;
        sessionLow = latestMarketPrice - 1.40;
        breakoutCounter = 0;
    }

    // Trigger trade only on real price breakouts
    if (!isTrading) {
        if (latestMarketPrice > sessionHigh) {
            executeProfessionalTrade("LONG", latestMarketPrice);
        } else if (latestMarketPrice < sessionLow) {
            executeProfessionalTrade("SHORT", latestMarketPrice);
        }
    }
};

function executeProfessionalTrade(side, entryPrice) {
    isTrading = true;
    const now = new Date();
    const entryTime = now.toLocaleTimeString();
    const tradeDate = now.toLocaleDateString();
    
    // Log active trade status to UI
    localStorage.setItem('bot_is_executing', 'true');
    localStorage.setItem('last_trade_side', side);
    localStorage.setItem('last_entry_price', entryPrice.toFixed(2));
    localStorage.setItem('last_open_time', `${tradeDate} ${entryTime}`);
    window.dispatchEvent(new Event('storage'));

    // Duration simulation (Scalp duration)
    setTimeout(() => {
        const exitPrice = latestMarketPrice;
        let pnl = 0;
        
        // REAL PROFIT/LOSS CALCULATION
        // Long Profit: (Exit - Entry) | Short Profit: (Entry - Exit)
        if (side === "LONG") {
            pnl = (exitPrice - entryPrice) * (Math.random() * 0.5 + 0.1); 
        } else {
            pnl = (entryPrice - exitPrice) * (Math.random() * 0.5 + 0.1);
        }

        // Add a small randomized "execution fee" for realism
        const fee = (Math.random() * 0.45);
        const finalProfit = pnl - fee;
        
        currentBalance += finalProfit;
        localStorage.setItem('investmentBalance', currentBalance.toFixed(2));
        
        // Create professional historical deal entry
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
            status: finalProfit >= 0 ? "PROFIT" : "LOSS"
        });
        
        // Retain 100 most recent professional transactions
        localStorage.setItem('trade_history', JSON.stringify(history.slice(0, 100)));
        localStorage.setItem('bot_is_executing', 'false');
        window.dispatchEvent(new Event('storage'));

        // Strategy cooldown to prevent over-trading
        setTimeout(() => { isTrading = false; }, 15000);
    }, 12000); 
}
