// Sidebar indicator + reset button for active severity

export function createSeverityFilter(containerId, onReset) {
    let currentSeverity = null;

    const container = document.getElementById(containerId);

    const wrapper = document.createElement('div');
    wrapper.className = 'severity-filter-container';
    wrapper.style.marginTop = '20px';

    const label = document.createElement('div');
    label.className = 'filter-label';
    label.textContent = 'Severity Filter';

    const indicator = document.createElement('div');
    indicator.id = 'severity-indicator';
    indicator.style.fontSize = '14px';
    indicator.style.color = '#ddd';
    indicator.textContent = 'No severity filter active';

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset Severity Filter';
    resetBtn.className = 'nav-button';
    resetBtn.style.marginTop = '8px';
    resetBtn.addEventListener('click', () => {
        currentSeverity = null;
        updateIndicator(null);
        if (onReset) onReset();
    });

    wrapper.appendChild(label);
    wrapper.appendChild(indicator);
    wrapper.appendChild(resetBtn);
    container.appendChild(wrapper);

    function updateIndicator(severity) {
        currentSeverity = severity;
        indicator.textContent = severity
            ? `Filtering by Severity ${severity}`
            : 'No severity filter active';
    }

    return {
        updateIndicator
    };
}
