const API_KEY = 'd51gp7hr01qhn003u9o0d51gp7hr01qhn003u9og'; 
const BASE_URL = 'https://finnhub.io/api/v1';

const STOCK_SYMBOLS = ['AAPL', 'MSFT', 'TSLA', 'AMZN', 'GOOGL'];


let homeChartInstance = null; 
let currentActiveSymbol = ''; 
let currentTimeRange = '1D';

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.mySwiper')) {
        initHomePage();
    } else if (document.getElementById('myChart')) {
        initPracticePage();
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
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        centeredSlides: true,
        slidesPerView: 1,
        loop: true,
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
        
        // Highlight the default selection
        if (span.textContent === currentTimeRange) {
            span.style.fontWeight = 'bold';
            span.style.color = '#228B22';
        }

        span.addEventListener('click', () => {
            const range = span.textContent;
            currentTimeRange = range;

            // Update styling for all buttons
            spans.forEach(s => {
                s.style.fontWeight = 'normal';
                s.style.color = '';
            });
            span.style.fontWeight = 'bold';
            span.style.color = '#228B22';

            // Reload graph with new time range
            loadStockGraph(currentActiveSymbol, range);
        });

        span.addEventListener('mouseenter', () => {
            if (span.textContent !== currentTimeRange) {
                span.style.backgroundColor = '#f0f0f0';
            }
        });

        span.addEventListener('mouseleave', () => {
            span.style.backgroundColor = '';
        });
    });
}

async function loadStockGraph(symbol, timeRange = '1D') {
    currentActiveSymbol = symbol;
    const container = document.getElementById('graph-area');

    try {
        const { from, to, resolution } = getTimeRangeParams(timeRange);
        
        // For intraday data (1D), use quote endpoint
        if (timeRange === '1D') {
            const response = await fetch(`${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`);
            if (!response.ok) throw new Error("API Limit");
            const data = await response.json();
            if (!data.c) throw new Error("No data");

            if (currentActiveSymbol !== symbol) return;

            const points = [data.pc, data.l, data.h, data.c];
            const labels = ['Previous Close', 'Day Low', 'Day High', 'Current Price'];
            drawHomeChart(container, labels, points, `${symbol} - ${timeRange}`);
        } else {
            // For historical data, use candles endpoint
            const response = await fetch(
                `${BASE_URL}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${API_KEY}`
            );
            
            if (!response.ok) throw new Error("API Limit");
            const data = await response.json();
            
            if (data.s === 'no_data' || !data.c || data.c.length === 0) {
                throw new Error("No data available");
            }

            if (currentActiveSymbol !== symbol) return;

            // Format the data for the chart
            const labels = data.t.map(timestamp => formatDate(timestamp, timeRange));
            const prices = data.c; // closing prices

            drawHomeChart(container, labels, prices, `${symbol} - ${timeRange}`);
        }

    } catch (err) {
        console.warn("Graph error", err);
        // Fallback with mock data
        if (currentActiveSymbol === symbol) {
            const mockData = generateMockData(timeRange);
            drawHomeChart(container, mockData.labels, mockData.prices, `${symbol} - ${timeRange} (Preview)`);
        }
    }
}

function getTimeRangeParams(range) {
    const now = Math.floor(Date.now() / 1000);
    let from, resolution;

    switch(range) {
        case '1D':
            from = now - 86400;
            resolution = '5'; // 5 minute intervals
            break;
        case '5D':
            from = now - (86400 * 5);
            resolution = '30'; // 30 minute intervals
            break;
        case '1M':
            from = now - (86400 * 30);
            resolution = 'D'; // Daily
            break;
        case '6M':
            from = now - (86400 * 180);
            resolution = 'D';
            break;
        case 'YTD':
            const yearStart = new Date(new Date().getFullYear(), 0, 1);
            from = Math.floor(yearStart.getTime() / 1000);
            resolution = 'D';
            break;
        case '1Y':
            from = now - (86400 * 365);
            resolution = 'D';
            break;
        case '5Y':
            from = now - (86400 * 365 * 5);
            resolution = 'W'; // Weekly
            break;
        default:
            from = now - 86400;
            resolution = '5';
    }
    return { from, to: now, resolution };
}

function formatDate(timestamp, range) {
    const date = new Date(timestamp * 1000);
    
    if (range === '1D' || range === '5D') {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (range === '1M' || range === '6M') {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
        return date.toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
    }
}

function generateMockData(range) {
    const dataPoints = {
        '1D': 10,
        '5D': 15,
        '1M': 20,
        '6M': 25,
        'YTD': 30,
        '1Y': 30,
        '5Y': 35
    };

    const count = dataPoints[range] || 10;
    const labels = [];
    const prices = [];
    let price = 150;

    // Generate mock dates based on time range
    const now = new Date();
    for (let i = 0; i < count; i++) {
        const date = new Date(now);
        
        // Calculate time intervals based on range
        if (range === '1D') {
            date.setHours(date.getHours() - (count - i) * 2); // 2-hour intervals
            labels.push(date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        } else if (range === '5D') {
            date.setHours(date.getHours() - (count - i) * 8); // 8-hour intervals
            labels.push(date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        } else if (range === '1M') {
            date.setDate(date.getDate() - (count - i) * 1.5); // ~1.5 day intervals
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        } else if (range === '6M') {
            date.setDate(date.getDate() - (count - i) * 7); // ~7 day intervals
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        } else if (range === 'YTD' || range === '1Y') {
            date.setDate(date.getDate() - (count - i) * 12); // ~12 day intervals
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        } else if (range === '5Y') {
            date.setMonth(date.getMonth() - (count - i) * 1.7); // ~2 month intervals
            labels.push(date.toLocaleDateString('en-US', { year: '2-digit', month: 'short' }));
        }
        
        price += (Math.random() - 0.5) * 10;
        prices.push(Math.max(100, price));
    }

    return { labels, prices };
}


function drawHomeChart(container, labels, dataPoints, labelText) {

    if (homeChartInstance) {
        homeChartInstance.destroy();
    }

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
                fill: true,
                tension: 0.3,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: true, labels: { color: 'white', font: { size: 14 } } } 
            },
            scales: {
                x: { ticks: { color: '#bbb' }, grid: { color: '#333' } },
                y: { ticks: { color: '#bbb' }, grid: { color: '#333' } }
            }
        }
    });
}


function initPracticePage() {
}

async function calculateGrowth() {
    const symbol = document.getElementById('stockName').value.toUpperCase();
    const money = parseFloat(document.getElementById('money').value);
    const years = parseInt(document.getElementById('years').value);
    const rateInput = document.getElementById('rate').value;

    if (!symbol || !money || !years) {
        alert("Please fill in all fields (Symbol, Amount, Years).");
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`);
        
        if (!response.ok) throw new Error("API Limit");
        
        const data = await response.json();
        
        if (!data.c) throw new Error("Symbol not found");
        

        const rate = rateInput ? parseFloat(rateInput) / 100 : 0.07;
        
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
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: `Projected Value: $${futureVal.toFixed(2)}`, color: 'white', font: { size: 16 } }
                },
                scales: {
                    x: { ticks: { color: 'white' } },
                    y: { ticks: { color: 'white' } }
                }
            }
        });

    } catch (err) {
        console.error(err);
        alert(`API Error: ${err.message}`);
    }
}