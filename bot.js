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
        sessionHigh = livePrice + 1.10;
        sessionLow = livePrice - 1.10;
    }

    pricePointCount++;
    if (pricePointCount > 60) { 
        sessionHigh = livePrice + 1.30;
        sessionLow = livePrice - 1.30;
        pricePointCount = 0;
    }

    if (!isTrading) {
        if (livePrice > sessionHigh) executeLiveTrade("LONG", livePrice);
        else if (livePrice < sessionLow) executeLiveTrade("SHORT", livePrice);
    }
};

function executeLiveTrade(side, entryPrice) {
    isTrading = true;
    const openTime = new Date().toLocaleTimeString(); // Capture Open Time
    
    localStorage.setItem('bot_is_executing', 'true');
    localStorage.setItem('last_trade_side', side);
    localStorage.setItem('last_entry_price', entryPrice.toFixed(2));
    localStorage.setItem('last_open_time', openTime);
    window.dispatchEvent(new Event('storage'));

    setTimeout(() => {
        const closeTime = new Date().toLocaleTimeString(); // Capture Close Time
        const profit = (Math.random() * 8 + 4.50); 
        currentBalance += profit;
        
        localStorage.setItem('investmentBalance', currentBalance.toFixed(2));
        
        // Save to Permanent Statement History
        let history = JSON.parse(localStorage.getItem('trade_history')) || [];
        history.unshift({
            side: side,
            entryPrice: entryPrice.toFixed(2),
            openTime: openTime,
            closeTime: closeTime,
            profit: profit.toFixed(2)
        });
        if (history.length > 20) history.pop();
        localStorage.setItem('trade_history', JSON.stringify(history));

        localStorage.setItem('bot_is_executing', 'false');
        window.dispatchEvent(new Event('storage'));

        setTimeout(() => { isTrading = false; }, 12000);
    }, 10000);
}
