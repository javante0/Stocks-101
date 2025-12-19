const STOCK_SYMBOLS = ['AAPL', 'MSFT', 'TSLA', 'AMZN', 'GOOGL'];

let homeChartInstance = null; 
let currentActiveSymbol = ''; 


document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.mySwiper')) {
        initHomePage();
    } else if (document.getElementById('myChart')) {
        initPracticePage();
    }
    if (document.getElementById('watchlist-container')) {
        loadWatchlist();
    }
});


async function initHomePage() {
    const wrapper = document.getElementById('ticker-tape');

    STOCK_SYMBOLS.forEach(symbol => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `<span style="font-weight:bold; font-size: 1.2rem;">${symbol}</span>`; 
        slide.dataset.symbol = symbol;
        slide.style.cursor = 'pointer';
        wrapper.appendChild(slide);
    });

    const swiper = new Swiper(".mySwiper", {
        navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
        centeredSlides: true, slidesPerView: 1, loop: true,
        on: {
            transitionEnd: function () {
                const realIndex = this.realIndex; 
                const symbol = STOCK_SYMBOLS[realIndex];
                loadStockGraph(symbol);
            }
        }
    });

    loadStockGraph(STOCK_SYMBOLS[0]);
}

async function loadStockGraph(symbol) {
    currentActiveSymbol = symbol;
    const container = document.getElementById('graph-area');

    try {
        const response = await fetch(`/api/get-stock-data?symbol=${symbol}`);
        
        if (!response.ok) throw new Error("API Error");
        const data = await response.json();
        
        if (!data.c) throw new Error("No data");
        if (currentActiveSymbol !== symbol) return;

        const points = [data.pc, data.l, data.h, data.c];
        const labels = ['Previous Close', 'Day Low', 'Day High', 'Current Price'];

        drawHomeChart(container, labels, points, `${symbol} Daily Trajectory`);

    } catch (err) {
        console.warn("Graph error", err);
        if (currentActiveSymbol === symbol) {
             const mockPrices = [150, 152, 149, 155];
             drawHomeChart(container, ['Open', 'Low', 'High', 'Current'], mockPrices, symbol + " (Preview)");
        }
    }
}

function drawHomeChart(container, labels, dataPoints, labelText) {
    if (homeChartInstance) homeChartInstance.destroy();
    
    container.innerHTML = ''; 
    const ctx = document.createElement('canvas');
    container.appendChild(ctx);

    const start = dataPoints[0];
    const end = dataPoints[dataPoints.length - 1];
    const color = end >= start ? '#228B22' : '#FF4444'; 

    homeChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: labelText,
                data: dataPoints, 
                borderColor: color, 
                backgroundColor: end >= start ? 'rgba(34, 139, 34, 0.1)' : 'rgba(255, 68, 68, 0.1)',
                fill: true, tension: 0.3, pointRadius: 6
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: true, labels: { color: 'white', font: { size: 14 } } } },
            scales: { x: { ticks: { color: '#bbb' }, grid: { color: '#333' } }, y: { ticks: { color: '#bbb' }, grid: { color: '#333' } } }
        }
    });
}


function initPracticePage() { }

async function calculateGrowth() {
    const symbol = document.getElementById('stockName').value.toUpperCase();
    const money = parseFloat(document.getElementById('money').value);
    const years = parseInt(document.getElementById('years').value);
    const rateInput = document.getElementById('rate').value;

    if (!symbol || !money || !years) return alert("Please fill in all fields.");

    const rate = rateInput ? parseFloat(rateInput) / 100 : 0.07;
    let currentPrice = 0;

    try {
        const response = await fetch(`/api/get-stock-data?symbol=${symbol}`);
        
        if (!response.ok) throw new Error("API Limit");
        const data = await response.json();
        
        if (!data.c) throw new Error("Symbol not found");
        currentPrice = data.c;

    } catch (err) {
        console.warn(err);
        currentPrice = 150.00; 
        alert("Using estimate price ($150) for calculation.");
    }

    const futureVal = money * Math.pow((1 + rate), years);

    const ctx = document.getElementById('myChart');
    if (window.practiceChart) window.practiceChart.destroy();

    window.practiceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Start Investment', `Value in ${years} Years`],
            datasets: [{
                label: `Growth based on ${symbol} (${(rate * 100).toFixed(1)}%)`,
                data: [money, futureVal],
                backgroundColor: ['#555555', '#228B22']
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { title: { display: true, text: `Projected Value: $${futureVal.toFixed(2)}`, color: 'white', font: { size: 16 } } },
            scales: { x: { ticks: { color: 'white' } }, y: { ticks: { color: 'white' } } }
        }
    });
}


async function loadWatchlist() {
    const container = document.getElementById('watchlist-container');
    if (!container) return; 

    try {
        const res = await fetch('/api/get-watchlist');
        const data = await res.json();

        container.innerHTML = ''; 
        if (data.length === 0) {
            container.innerHTML = '<p>No stocks saved yet.</p>';
            return;
        }

        data.forEach(item => {
            const div = document.createElement('div');
            div.style.cssText = "background: rgba(0,0,0,0.2); margin-bottom: 8px; padding: 10px; border-radius: 4px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border: 1px solid #333;";
            div.innerHTML = `<strong>${item.symbol}</strong> <span style="font-size:0.8rem; color:#228B22;">Load ↗</span>`;
            div.onclick = () => { document.getElementById('stockName').value = item.symbol; };
            container.appendChild(div);
        });
    } catch (err) {
        console.error("Database Error:", err);
        container.innerHTML = '<p>Error loading list.</p>';
    }
}

async function addToWatchlist() {
    const symbolInput = document.getElementById('watchInput');
    const symbol = symbolInput.value.toUpperCase();
    if (!symbol) return alert("Please type a symbol");

    try {
        const res = await fetch('/api/add-watchlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: symbol })
        });
        if (res.ok) {
            symbolInput.value = ''; 
            loadWatchlist(); 
        } else {
            alert("Error saving to database");
        }
    } catch (err) {
        console.error(err);
    }
}