// bot.js - Professional Stateful Execution Engine
let currentBalance = parseFloat(localStorage.getItem('investmentBalance')) || 799.00;
let latestMarketPrice = 0;
const binanceWs = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');

// Market Structure Parameters
let sessionHigh = 0;
let sessionLow = 0;
let lastTradeTime = 0;

binanceWs.onmessage = (event) => {
    const data = JSON.parse(event.data);
    latestMarketPrice = parseFloat(data.p);

    // Initialize session boundaries
    if (sessionHigh === 0) {
        sessionHigh = latestMarketPrice + 5.00; // Tighter ranges for faster entries
        sessionLow = latestMarketPrice - 5.00;
    }

    manageActiveTrades();
    checkForNewTrades();
    updateFinancials();
};

function manageActiveTrades() {
    let activeTrades = JSON.parse(localStorage.getItem('active_trades')) || [];
    let updated = false;
    const now = Date.now();

    activeTrades = activeTrades.filter(trade => {
        let isLong = trade.side === 'LONG';
        // Calculate raw distance moved
        let priceDiff = isLong ? (latestMarketPrice - trade.entryPrice) : (trade.entryPrice - latestMarketPrice);
        
        // Simulating a 0.5 BTC position size for realistic dollar movements
        trade.currentProfit = priceDiff * 0.5;
        trade.currentPrice = latestMarketPrice;

        let closeReason = null;

        // 1. Check Take Profit and Stop Loss exactly at market price
        if (trade.tp > 0) {
            if (isLong && latestMarketPrice >= trade.tp) closeReason = "Take Profit Hit";
            if (!isLong && latestMarketPrice <= trade.tp) closeReason = "Take Profit Hit";
        }
        if (trade.sl > 0) {
            if (isLong && latestMarketPrice <= trade.sl) closeReason = "Stop Loss Hit";
            if (!isLong && latestMarketPrice >= trade.sl) closeReason = "Stop Loss Hit";
        }

        // 2. Professional Auto-Management (10 to 30 min max hold time)
        let tradeDurationMs = now - trade.id;
        if (!closeReason && tradeDurationMs >= trade.maxHoldTime) {
            closeReason = trade.currentProfit >= 0 ? "Auto Take Profit" : "Auto Cut Loss";
        }

        if (closeReason) {
            closeTradeInternal(trade, closeReason);
            updated = true;
            return false; // Remove from active array
        }
        return true; // Keep active
    });

    localStorage.setItem('active_trades', JSON.stringify(activeTrades));
    // Trigger UI refresh frequently to see floating numbers move
    if (updated || activeTrades.length > 0) window.dispatchEvent(new Event('storage'));
}

function closeTradeInternal(trade, reason) {
    currentBalance += trade.currentProfit;
    localStorage.setItem('investmentBalance', currentBalance.toFixed(2));

    let history = JSON.parse(localStorage.getItem('trade_history')) || [];
    history.unshift({
        side: trade.side,
        entryPrice: trade.entryPrice.toFixed(2),
        exitPrice: latestMarketPrice.toFixed(2),
        openTime: trade.openTime,
        closeTime: new Date().toLocaleTimeString(),
        profit: Math.abs(trade.currentProfit).toFixed(2),
        isWin: trade.currentProfit >= 0,
        reason: reason
    });
    
    localStorage.setItem('trade_history', JSON.stringify(history.slice(0, 100)));
    localStorage.setItem('bot_is_executing', 'false');
    
    // Reset ranges and cooldown after a trade
    sessionHigh = latestMarketPrice + 10.00;
    sessionLow = latestMarketPrice - 10.00;
    lastTradeTime = Date.now();
    
    window.dispatchEvent(new Event('storage'));
}

// Global functions so the HTML buttons can call them
window.manualCloseTrade = function(tradeId) {
    let activeTrades = JSON.parse(localStorage.getItem('active_trades')) || [];
    const tradeIndex = activeTrades.findIndex(t => t.id == tradeId);
    if (tradeIndex > -1) {
        closeTradeInternal(activeTrades[tradeIndex], "Manual Close");
        activeTrades.splice(tradeIndex, 1);
        localStorage.setItem('active_trades', JSON.stringify(activeTrades));
        window.dispatchEvent(new Event('storage'));
    }
};

window.modifyTradeLimits = function(tradeId, sl, tp) {
    let activeTrades = JSON.parse(localStorage.getItem('active_trades')) || [];
    const tradeIndex = activeTrades.findIndex(t => t.id == tradeId);
    if (tradeIndex > -1) {
        activeTrades[tradeIndex].sl = sl ? parseFloat(sl) : null;
        activeTrades[tradeIndex].tp = tp ? parseFloat(tp) : null;
        localStorage.setItem('active_trades', JSON.stringify(activeTrades));
        window.dispatchEvent(new Event('storage'));
    }
};

function checkForNewTrades() {
    let activeTrades = JSON.parse(localStorage.getItem('active_trades')) || [];
    if (activeTrades.length >= 1) return; // Only hold 1 position at a time
    if (Date.now() - lastTradeTime < 60000) return; // 1-minute cooldown between trades

    if (latestMarketPrice > sessionHigh) executeTrade("LONG", latestMarketPrice);
    else if (latestMarketPrice < sessionLow) executeTrade("SHORT", latestMarketPrice);
}

function executeTrade(side, entryPrice) {
    const now = Date.now();
    // Random hold time between 10 and 30 minutes (in milliseconds)
    const maxHoldTime = Math.floor(Math.random() * (30 - 10 + 1) + 10) * 60000; 

    const newTrade = {
        id: now,
        side: side,
        entryPrice: entryPrice,
        currentPrice: entryPrice,
        currentProfit: 0,
        openTime: new Date().toLocaleTimeString(),
        tp: null,
        sl: null,
        maxHoldTime: maxHoldTime
    };

    let activeTrades = JSON.parse(localStorage.getItem('active_trades')) || [];
    activeTrades.push(newTrade);
    localStorage.setItem('active_trades', JSON.stringify(activeTrades));
    localStorage.setItem('bot_is_executing', 'true');
    window.dispatchEvent(new Event('storage'));
}

function updateFinancials() {
    let activeTrades = JSON.parse(localStorage.getItem('active_trades')) || [];
    let floatingPnL = activeTrades.reduce((sum, t) => sum + t.currentProfit, 0);
    
    let equity = currentBalance + floatingPnL;
    let freeMargin = equity * 0.95; // Pro reserve formula

    localStorage.setItem('investmentEquity', equity.toFixed(2));
    localStorage.setItem('freeMargin', freeMargin.toFixed(2)); 
    
    // We do NOT dispatch event here to avoid infinite loops, the UI reads these via the interval/events.
}
