// Auto-refresh Dashboard every 30 seconds
const REFRESH_INTERVAL = 30000;

async function refreshStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        const values = [
            stats.total_tips,
            stats.total_points,
            stats.avg_points_per_match,
            stats.exact_correct,
            stats.difference_correct,
            stats.tendency_correct,
            stats.avg_expected_points,
            `${(stats.avg_confidence * 100).toFixed(1)}%`
        ];

        document.querySelectorAll('.stat-value').forEach((el, idx) => {
            if (values[idx] !== undefined) el.textContent = values[idx];
        });
    } catch (error) {
        console.error('Error refreshing stats:', error);
    }
}

async function refreshTipps() {
    try {
        const response = await fetch('/api/tipps');
        const tipps = await response.json();

        const tbody = document.querySelector('.tipps-table tbody');
        tbody.innerHTML = '';

        tipps.forEach(tipp => {
            const row = document.createElement('tr');

            let rowClass = 'pending';
            if (tipp.points_won === 4) rowClass = 'exact';
            else if (tipp.points_won === 3) rowClass = 'diff';
            else if (tipp.points_won === 2) rowClass = 'tend';
            else if (tipp.points_won === 0) rowClass = 'lost';
            row.className = rowClass;

            const confPercent = ((tipp.confidence || 0) * 100).toFixed(1);
            const ep = (tipp.expected_points || 0).toFixed(2);
            const lambdaH = (tipp.lambda_home || 0).toFixed(1);
            const lambdaA = (tipp.lambda_away || 0).toFixed(1);

            const pointsBadge = tipp.points_won !== null && tipp.points_won !== undefined
                ? `<span class="badge points-${tipp.points_won}">${tipp.points_won}P</span>`
                : `<span class="badge pending">…</span>`;

            row.innerHTML = `
                <td><strong>${tipp.team1} vs ${tipp.team2}</strong></td>
                <td class="tip-badge">${tipp.tip_str}</td>
                <td>${ep}</td>
                <td>${confPercent}%</td>
                <td><small>${lambdaH}/${lambdaA}</small></td>
                <td>${tipp.actual_str || '⏳'}</td>
                <td>${pointsBadge}</td>
            `;

            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error refreshing tipps:', error);
    }
}

async function refreshLogs() {
    try {
        const response = await fetch('/api/logs');
        const logs = await response.json();

        const logsList = document.querySelector('.logs-list');
        logsList.innerHTML = '';

        logs.forEach(log => {
            const entry = document.createElement('div');
            entry.className = `log-entry log-${log.level.toLowerCase()}`;

            const time = new Date(log.timestamp).toLocaleTimeString('de-DE');
            entry.innerHTML = `
                <span class="log-time">${time}</span>
                <span class="log-level">[${log.level}]</span>
                <span class="log-message">${log.message}</span>
            `;

            logsList.appendChild(entry);
        });
    } catch (error) {
        console.error('Error refreshing logs:', error);
    }
}

function refreshDashboard() {
    console.log(`[${new Date().toLocaleTimeString()}] Refreshing dashboard...`);
    refreshStats();
    refreshTipps();
    refreshLogs();
}

refreshDashboard();
setInterval(refreshDashboard, REFRESH_INTERVAL);

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshDashboard();
});

console.log('✅ Dashboard JS loaded. Auto-refresh every 30s');
