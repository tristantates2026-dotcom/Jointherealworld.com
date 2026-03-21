let currentBalance = parseFloat(localStorage.getItem('investmentBalance')) || 799.00;
let isTrading = false;
let latestLivePrice = 0; // Global tracker for exit prices
const binanceWs = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');

let sessionHigh = 0, sessionLow = 0, pricePointCount = 0;

binanceWs.onmessage = (event) => {
    const data = JSON.parse(event.data);
    latestLivePrice = parseFloat(data.p);
    
    if (sessionHigh === 0) {
        sessionHigh = latestLivePrice + 1.10;
        sessionLow = latestLivePrice - 1.10;
    }

    pricePointCount++;
    if (pricePointCount > 40) { // High frequency scanning
        sessionHigh = latestLivePrice + 1.25;
        sessionLow = latestLivePrice - 1.25;
        pricePointCount = 0;
    }

    if (!isTrading) {
        if (latestLivePrice > sessionHigh) executeLiveTrade("LONG", latestLivePrice);
        else if (latestLivePrice < sessionLow) executeLiveTrade("SHORT", latestLivePrice);
    }
};

function executeLiveTrade(side, entryPrice) {
    isTrading = true;
    const now = new Date();
    const openTimeStr = now.toLocaleTimeString();
    const fullDate = now.toLocaleDateString();
    
    localStorage.setItem('bot_is_executing', 'true');
    localStorage.setItem('last_trade_side', side);
    localStorage.setItem('last_entry_price', entryPrice.toFixed(2));
    localStorage.setItem('last_open_time', openTimeStr);
    window.dispatchEvent(new Event('storage'));

    // Hold trade for 10-15 seconds
    setTimeout(() => {
        const exitPrice = latestLivePrice; // Capture real crypto price at close
        const profit = (Math.random() * 9 + 4.80); 
        currentBalance += profit;
        
        localStorage.setItem('investmentBalance', currentBalance.toFixed(2));
        
        let history = JSON.parse(localStorage.getItem('trade_history')) || [];
        history.unshift({
            side: side,
            entryPrice: entryPrice.toFixed(2),
            exitPrice: exitPrice.toFixed(2),
            openTime: openTimeStr,
            closeTime: new Date().toLocaleTimeString(),
            date: fullDate,
            rawDate: new Date().toISOString(), // For filtering
            profit: profit.toFixed(2)
        });
        
        localStorage.setItem('trade_history', JSON.stringify(history.slice(0, 50)));
        localStorage.setItem('bot_is_executing', 'false');
        window.dispatchEvent(new Event('storage'));

        setTimeout(() => { isTrading = false; }, 10000);
    }, 12000);
}
