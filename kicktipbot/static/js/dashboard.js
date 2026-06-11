// Auto-refresh Dashboard every 30 seconds
const REFRESH_INTERVAL = 30000;

async function refreshStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        // Update stats cards
        document.querySelectorAll('.stat-value').forEach((el, idx) => {
            const values = [
                stats.total_tips,
                `${stats.win_rate.toFixed(1)}%`,
                stats.correct_tips,
                stats.avg_confidence.toFixed(2)
            ];
            el.textContent = values[idx];
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
            row.className = tipp.won === true ? 'won' : tipp.won === false ? 'lost' : 'pending';

            const confidencePercent = (tipp.confidence * 100).toFixed(0);
            const statusBadge = tipp.won === true ? '✓' : tipp.won === false ? '✗' : '…';
            const statusClass = tipp.won === true ? 'success' : tipp.won === false ? 'error' : 'pending';

            row.innerHTML = `
                <td><strong>${tipp.team1} vs ${tipp.team2}</strong></td>
                <td class="tip-badge">${tipp.tip}</td>
                <td>${confidencePercent}%</td>
                <td><small>${new Date(tipp.placed_at).toLocaleString('de-DE')}</small></td>
                <td>${tipp.result || '⏳'}</td>
                <td><span class="badge ${statusClass}">${statusBadge}</span></td>
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

// Initial refresh
refreshDashboard();

// Auto-refresh every 30 seconds
setInterval(refreshDashboard, REFRESH_INTERVAL);

// Refresh on focus
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        refreshDashboard();
    }
});

console.log('✅ Dashboard JS loaded. Auto-refresh every 30s');
