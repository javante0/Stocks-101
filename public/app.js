const STOCK_SYMBOLS = ['AAPL', 'MSFT', 'TSLA', 'AMZN', 'GOOGL'];

let homeChartInstance = null; 
let currentActiveSymbol = ''; 
let currentTimeRange = '1D';


document.addEventListener('DOMContentLoaded', () => {
    // 1. Home Page
    if (document.querySelector('.mySwiper')) {
        initHomePage();
    } 
    // 2. Practice Page
    else if (document.getElementById('myChart')) {
        initPracticePage();
    }
    // 3. Watchlist (Runs on both if container exists)
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
                loadStockGraph(symbol, currentTimeRange);
            }
        }
    });

    initTimeRangeButtons();
    loadStockGraph(STOCK_SYMBOLS[0], currentTimeRange);
}

function initTimeRangeButtons() {
    const timeRanges = document.querySelector('.time-ranges');
    if (!timeRanges) return;

    const spans = timeRanges.querySelectorAll('span');
    spans.forEach(span => {
        span.style.cursor = 'pointer';
        span.style.padding = '5px 8px';
        span.style.transition = 'all 0.2s';
        
        if (span.textContent === currentTimeRange) {
            span.style.fontWeight = 'bold';
            span.style.color = '#228B22';
        }

        span.addEventListener('click', () => {
            const range = span.textContent;
            currentTimeRange = range;

            spans.forEach(s => {
                s.style.fontWeight = 'normal';
                s.style.color = '';
            });
            span.style.fontWeight = 'bold';
            span.style.color = '#228B22';

            loadStockGraph(currentActiveSymbol, range);
        });
    });
}

async function loadStockGraph(symbol, timeRange = '1D') {
    currentActiveSymbol = symbol;
    const container = document.getElementById('graph-area');

    try {
        if (timeRange === '1D') {
            const response = await fetch(`/api/get-stock-data?symbol=${symbol}`);
            
            if (!response.ok) throw new Error("API Error");
            const data = await response.json();
            
            if (!data.c) throw new Error("No data");
            if (currentActiveSymbol !== symbol) return;

            const points = [data.pc, data.l, data.h, data.c];
            const labels = ['Previous Close', 'Day Low', 'Day High', 'Current Price'];
            drawHomeChart(container, labels, points, `${symbol} - ${timeRange}`);
        } else {

            throw new Error("History API not connected yet");
        }

    } catch (err) {

        if (currentActiveSymbol === symbol) {
            const mockData = generateMockData(timeRange);
            drawHomeChart(container, mockData.labels, mockData.prices, `${symbol} - ${timeRange} (Preview)`);
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


function generateMockData(range) {
    const countMap = { '1D': 10, '5D': 15, '1M': 20, '6M': 25, 'YTD': 30, '1Y': 30, '5Y': 35 };
    const count = countMap[range] || 10;
    const labels = [];
    const prices = [];
    let price = 150;
    const now = new Date();

    for (let i = 0; i < count; i++) {
        const date = new Date(now);
        if (range === '1D') date.setHours(date.getHours() - (count - i));
        else date.setDate(date.getDate() - (count - i));
        
        labels.push(range === '1D' ? date.toLocaleTimeString() : date.toLocaleDateString());
        price += (Math.random() - 0.5) * 10;
        prices.push(Math.max(100, price));
    }
    return { labels, prices };
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

    const placeholder = document.getElementById('graph-placeholder-text');
    if (placeholder) placeholder.style.display = 'none';

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
            div.style.cssText = "background: rgba(0,0,0,0.2); margin-bottom: 8px; padding: 10px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #333;";
            
            div.innerHTML = `
                <div style="flex-grow: 1; cursor: pointer;" onclick="document.getElementById('stockName').value = '${item.symbol}'">
                    <strong>${item.symbol}</strong> 
                    <span style="font-size:0.8rem; color:#228B22; margin-left: 10px;">Load ↗</span>
                </div>
                <button onclick="deleteStock(${item.id})" style="background: #ff4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-left: 10px;">
                    ✕
                </button>
            `;
            
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

async function deleteStock(id) {
    if (!confirm("Remove this stock from watchlist?")) return;

    try {
        const response = await fetch(`/api/delete-watchlist/${id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            loadWatchlist(); 
        } else {
            console.error('Failed to delete stock');
            alert("Error deleting stock");
        }
    } catch (error) {
        console.error('Error:', error);
    }
}