
const API_KEY = 'd51gp7hr01qhn003u9o0d51gp7hr01qhn003u9og'; 
const BASE_URL = 'https://finnhub.io/api/v1';

const STOCK_SYMBOLS = ['AAPL', 'MSFT', 'TSLA', 'AMZN', 'GOOGL'];


let homeChartInstance = null; 
let currentActiveSymbol = ''; 

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
        const response = await fetch(`${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`);
        
        if (!response.ok) throw new Error("API Limit");
        const data = await response.json();
        if (!data.c) throw new Error("No data");

        if (currentActiveSymbol !== symbol) return;

        const points = [data.pc, data.l, data.h, data.c];
        const labels = ['Previous Close', 'Day Low', 'Day High', 'Current Price'];

        drawHomeChart(container, labels, points, `${symbol} Daily Trajectory`);

    } catch (err) {
        console.warn("Graph error", err);
        // Fallback
        if (currentActiveSymbol === symbol) {
             const mockPrices = [150, 152, 149, 155];
             drawHomeChart(container, ['Open', 'Low', 'High', 'Current'], mockPrices, symbol + " (Preview)");
        }
    }
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