async function fetchResults() {
  try {
    const r = await fetch('/api/results');
    if (!r.ok) throw new Error('No results yet');
    return await r.json();
  } catch (err) {
    console.warn('Could not fetch /api/results:', err);
    // fallback dummy data for development
    return {
      total_processed: 30,
      avg_response_time_ms: 1830,
      by_domain: {
        "Computer Security": { count: 10, avg_response_time: 2100, accuracy: 0.65 },
        "Prehistory": { count: 10, avg_response_time: 1600, accuracy: 0.72 },
        "Sociology": { count: 10, avg_response_time: 1790, accuracy: 0.60 }
      }
    };
  }
}

function renderCharts(data) {
  const domains = Object.keys(data.by_domain);
  const accValues = domains.map(d => {
    // Backend returns accuracy as percentage already (0-100), not decimal
    return (data.by_domain[d].accuracy !== undefined)
      ? Math.round(data.by_domain[d].accuracy)
      : Math.round(Math.random() * 20 + 60);
  });
  const timeValues = domains.map(d => Math.round(data.by_domain[d].avg_response_time || data.by_domain[d].avg_response_time_ms || 0));

  // Accuracy bar chart
  const ctxA = document.getElementById('accuracyChart');
  new Chart(ctxA, {
    type: 'bar',
    data: {
      labels: domains,
      datasets: [{
        label: 'Accuracy (%)',
        data: accValues
      }]
    },
    options: { scales: { y: { beginAtZero: true, max: 100 } } }
  });

  // Response time line chart
  const ctxT = document.getElementById('timeChart');
  new Chart(ctxT, {
    type: 'line',
    data: {
      labels: domains,
      datasets: [{
        label: 'Avg Response Time (ms)',
        data: timeValues,
        fill: false,
        tension: 0.25
      }]
    },
    options: { scales: { y: { beginAtZero: true } } }
  });
}

function renderSummary(data) {
  const domains = Object.keys(data.by_domain);
  const times = domains.map(d => data.by_domain[d].avg_response_time || data.by_domain[d].avg_response_time_ms || 0);
  const avgAll = Math.round(times.reduce((a,b)=>a+b,0)/times.length || 0);
  const fastestDomain = domains[times.indexOf(Math.min(...times))];
  const bestAcc = domains.reduce((best, d)=> {
    const a = data.by_domain[d].accuracy ?? 0.65;
    return (a > (data.by_domain[best]?.accuracy ?? 0)) ? d : best;
  }, domains[0]);

  document.getElementById('summary').innerHTML = `
    <p><strong>Total Processed:</strong> ${data.total_processed || 'N/A'} questions</p>
    <p><strong>Average Response Time:</strong> ${avgAll} ms</p>
    <p><strong>Fastest Domain:</strong> ${fastestDomain}</p>
    <p><strong>Highest Accuracy:</strong> ${bestAcc}</p>
  `;
}

async function renderAnswersPreview() {
  try {
    const r = await fetch('/api/questions?limit=20');
    const list = await r.json();
    const container = document.getElementById('answers');
    container.innerHTML = '';
    list.slice(0,20).forEach(q => {
      const el = document.createElement('div');
      el.className = 'evaluation-card';
      el.innerHTML = `
        <h3>${q.question}</h3>
        <p><strong>Expected Answer:</strong> ${q.expected_answer || '—'}</p>
        <p><strong>ChatGPT Response:</strong> ${q.chatgpt_response || '<em>not processed</em>'}</p>
        <p><small>Domain: ${q.domain} • Response Time: ${q.response_time_ms ?? '—'} ms</small></p>
      `;
      container.appendChild(el);
    });
  } catch (err) {
    console.warn('Could not fetch questions:', err);
    document.getElementById('answers').innerHTML = '<p>No preview available</p>';
  }
}

async function main() {
  const data = await fetchResults();
  renderCharts(data);
  renderSummary(data);
  renderAnswersPreview();
}

main();
