let currentBalance = parseFloat(localStorage.getItem('investmentBalance')) || 799.00;
let isTrading = false;
const binanceWs = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');

let sessionHigh = 0;
let sessionLow = 0;
let pricePointCount = 0;

binanceWs.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const livePrice = parseFloat(data.p);
    
    if (sessionHigh === 0) {
        sessionHigh = livePrice + 1.20;
        sessionLow = livePrice - 1.20;
    }

    pricePointCount++;
    if (pricePointCount > 50) { // Increased frequency for more trades
        sessionHigh = livePrice + 1.50;
        sessionLow = livePrice - 1.50;
        pricePointCount = 0;
    }

    if (!isTrading) {
        if (livePrice > sessionHigh) executeLiveTrade("LONG", livePrice);
        else if (livePrice < sessionLow) executeLiveTrade("SHORT", livePrice);
    }
};

function executeLiveTrade(side, entryPrice) {
    isTrading = true;
    const entryTime = new Date().toLocaleTimeString();
    
    // Save active state
    localStorage.setItem('bot_is_executing', 'true');
    localStorage.setItem('last_trade_side', side);
    localStorage.setItem('last_entry_price', entryPrice.toFixed(2));
    localStorage.setItem('last_entry_time', entryTime);
    window.dispatchEvent(new Event('storage')); // Alert other tabs

    setTimeout(() => {
        const profit = (Math.random() * 10 + 5.20); 
        currentBalance += profit;
        
        // Save Balance
        localStorage.setItem('investmentBalance', currentBalance.toFixed(2));
        
        // Save Permanent History
        let history = JSON.parse(localStorage.getItem('trade_history')) || [];
        history.unshift({
            side: side,
            entryPrice: entryPrice.toFixed(2),
            time: entryTime,
            profit: profit.toFixed(2)
        });
        if (history.length > 20) history.pop();
        localStorage.setItem('trade_history', JSON.stringify(history));

        // Finish Trade
        localStorage.setItem('bot_is_executing', 'false');
        localStorage.setItem('last_profit', profit.toFixed(2));
        window.dispatchEvent(new Event('storage'));

        setTimeout(() => { isTrading = false; }, 10000);
    }, 8000);
}
