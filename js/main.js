const tips = [
    "Hello, I am your project assistant.",
    "Evaluate ChatGPT efficieny across different domains.",
    "Check the project tab to view charts and results.",
    "We used Node.js, MongoDB, WebSockets, and the OpenAI API."
];

let tipIndex = 0;
let tipInterval = null;

function rotateTips(){
    const el = document.getElementById("assistant-text");
    if(!el) return;
    
    // Fade out
    el.style.opacity = 0;
    
    // After fade completes, change text and fade in
    setTimeout(() => {
        el.textContent = tips[tipIndex];
        el.style.opacity = 1;
        tipIndex = (tipIndex + 1) % tips.length;
    }, 300);
}

// Initialize on page load
window.addEventListener("load", () => {
    rotateTips(); 
    if (tipInterval) clearInterval(tipInterval); 
    tipInterval = setInterval(rotateTips, 4000);
});

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
    if (tipInterval) clearInterval(tipInterval);
});

//WEBSOCKET CLIENT-SIDE

let projectSocket;

function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    projectSocket = new WebSocket(wsUrl);
    
    projectSocket.onopen = () => {
        console.log('Connected to WebSocket server');
        document.getElementById('wsStatus').textContent = 'Connected';
        document.getElementById('wsStatus').style.color = 'green';
    };
   
    projectSocket.onmessage = (event) => {
        const box = document.getElementById("wsMessages");
        if(!box) return;
        box.innerHTML += `<p>${event.data}</p>`;
    };

    projectSocket.onclose = () => {
        // Runs when connection closes
        console.log('WebSocket disconnected');
        document.getElementById('wsStatus').textContent = 'Disconnected';
        document.getElementById('wsStatus').style.color = 'red';
    };

    projectSocket.onerror = (error) => {
        // Runs when error occurs
        console.error('WebSocket error:', error);
    };
}
window.addEventListener('load', initWebSocket);


document.getElementById('wsSendBtn')?.addEventListener('click', () => {
    const input = document.getElementById('wsInput');
    const message = input.value;


    if (message.trim() && projectSocket && projectSocket.readyState === WebSocket.OPEN) {
        projectSocket.send(message);
        input.value = '';
        const box = document.getElementById('wsMessages');
        if (!box) return;
        box.innerHTML += `<p>${message}</p>`;
    }
})

document.getElementById('btnAdd')?.addEventListener('click', () => {
    const numA = document.getElementById('addA').value;
    const numB = document.getElementById('addB').value;

    const url = `/api/add?a=${numA}&b=${numB}`;
    fetch(url) 
        .then(response => response.json())
        .then(data => {
            const resultElement = document.getElementById('addResult');
            if (resultElement) {
                resultElement.textContent = `Result: ${data.result}`;
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

// Import questions button handler
document.getElementById('btnImport')?.addEventListener('click', () => {
    const resultElement = document.getElementById('importResult');
    if (resultElement) {
        resultElement.textContent = 'Importing questions...';
    }

    fetch('/api/import-questions')
        .then(response => response.json())
        .then(data => {
            if (resultElement) {
                if (data.success) {
                    resultElement.textContent = `✅ ${data.message}. Total in DB: ${data.total}`;
                } else {
                    resultElement.textContent = `❌ Error: ${data.error}`;
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            if (resultElement) {
                resultElement.textContent = `❌ Error importing questions: ${error.message}`;
            }
        });
});

// Clear database button handler
document.getElementById('btnClearDatabase')?.addEventListener('click', () => {

    const confirmButton = confirm("Are you sure?");
    cleardbStatusElement = document.getElementById("clearStatus");

    if (confirmButton) {
        if (cleardbStatusElement) {
                    cleardbStatusElement.textContent = 'Status: Clearing database of ChatGPTs previous answers....';
                }
        fetch("/api/clear-database")
            .then(response => response.json())
            .then (data => {
                if (cleardbStatusElement) {
                    if (data.success) {
                        cleardbStatusElement.textContent = `✅ Status: Completed! cleared database of all ${data.deleted} answers/processed questions.`;
                    } else {
                    statusElement.textContent = `❌ Status: Error - ${data.error}`;
                    }
                }
            })
    } else {
        console.log("deletion cancelled");
    }


    console.log('Clear database button clicked - implement your logic here!');
});

document.getElementById('btnRunEval')?.addEventListener('click', () => {
    const domain = document.getElementById('domainSelect')?.value || '';
    const limit = document.getElementById('limitInput')?.value || 5;
    const statusElement = document.getElementById('evalStatus');
    
    if (statusElement) {
        statusElement.textContent = 'Status: Processing questions...';
    }

    let url = `/api/process-questions?limit=${limit}`;
    if (domain) {
        url += `&domain=${encodeURIComponent(domain)}`;
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (statusElement) {
                if (data.success) {
                    statusElement.textContent = `✅ Status: Completed! Processed ${data.processed} of ${data.total} questions.`;
                } else {
                    statusElement.textContent = `❌ Status: Error - ${data.error}`;
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            if (statusElement) {
                statusElement.textContent = `❌ Status: Error - ${error.message}`;
            }
        });
});



// Chart instances (to destroy and recreate)
let accuracyChart = null;
let timeChart = null;

window.drawCharts = function(data) {
    if (accuracyChart) accuracyChart.destroy();
    if (timeChart) timeChart.destroy();

    const domains = Object.keys(data.by_domain);
    const accuracies = domains.map(domain => data.by_domain[domain].accuracy);
    const avgTimes = domains.map(domain => data.by_domain[domain].avg_response_time);

    // Draw Accuracy Bar Chart
    const accuracyCtx = document.getElementById('accuracyChart');
    if (accuracyCtx) {
        accuracyChart = new Chart(accuracyCtx, {
            type: 'bar',
            data: {
                labels: domains,
                datasets: [{
                    label: 'Accuracy (%)',
                    data: accuracies,
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'ChatGPT Accuracy by Domain',
                        font: { size: 16 }
                    },
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Accuracy Percentage'
                        }
                    }
                }
            }
        });
    }

    // Draw Response Time Line Chart
    const timeCtx = document.getElementById('timeChart');
    if (timeCtx) {
        timeChart = new Chart(timeCtx, {
            type: 'line',
            data: {
                labels: domains,
                datasets: [{
                    label: 'Avg Response Time (ms)',
                    data: avgTimes,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Response Time Analysis by Domain',
                        font: { size: 16 }
                    },
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Milliseconds (ms)'
                        }
                    }
                }
            }
        });
    }

    // Create new summary dashboard
    summaryDiv = document.createElement('div');
    summaryDiv.id = 'summaryDashboard';
    summaryDiv.style.cssText = 'background: #f0f0f0; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px solid #ccc;';
    
    summaryDiv.innerHTML = `
        <h3 style="margin-top: 0; color: #333;">📊 Summary Dashboard</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div style="background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 24px; font-weight: bold; color: #4CAF50;">${data.total_processed}</div>
                <div style="color: #666;">Total Questions Processed</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 24px; font-weight: bold; color: #2196F3;">${data.overall_accuracy}%</div>
                <div style="color: #666;">Overall Accuracy</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 24px; font-weight: bold; color: #FF9800;">${data.avg_response_time_ms} ms</div>
                <div style="color: #666;">Avg Response Time</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 24px; font-weight: bold; color: #9C27B0;">${Object.keys(data.by_domain).length}</div>
                <div style="color: #666;">Domains Tested</div>
            </div>
        </div>
    `;
    
    const button = document.getElementById('btnLoadResults');
    const resultsSection = document.getElementById('results');
    if (resultsSection && button){
        const oldSummary =document.getElementById('summaryDashboard')
        if(oldSummary)oldSummary.remove();
        resultsSection.insertBefore(summaryDiv, button);}
}

document.getElementById('btnLoadResults')?.addEventListener('click', () => {
    fetch('/api/results')
        .then(response => response.json())
        .then(data => {
            console.log('Results data:', data);
            if (data.total_processed > 0) {
                window.drawCharts(data);
            } else {
                alert('No processed questions found. Process some questions first!');
            }
        })
        .catch(error => {
            console.error('Error loading results:', error);
            alert('Error loading results: ' + error.message);
        });
});
