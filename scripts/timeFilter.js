// Sidebar UI for time filter indicator and reset

export function createTimeFilter(containerId, onReset) {
    let currentTimeLabel = null;
    let currentMode = null;

    const container = document.getElementById(containerId);

    const wrapper = document.createElement('div');
    wrapper.className = 'time-filter-container';
    wrapper.style.marginTop = '20px';

    const label = document.createElement('div');
    label.className = 'filter-label';
    label.textContent = 'Time Filter';

    const indicator = document.createElement('div');
    indicator.id = 'time-indicator';
    indicator.style.fontSize = '14px';
    indicator.style.color = '#ddd';
    indicator.textContent = 'No time filter active';

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset Time Filter';
    resetBtn.className = 'nav-button';
    resetBtn.style.marginTop = '8px';
    resetBtn.addEventListener('click', () => {
        currentTimeLabel = null;
        currentMode = null;
        updateIndicator(null, null);
        if (onReset) onReset();
    });

    wrapper.appendChild(label);
    wrapper.appendChild(indicator);
    wrapper.appendChild(resetBtn);
    container.appendChild(wrapper);

    function updateIndicator(mode, label) {
        currentTimeLabel = label;
        currentMode = mode;

        indicator.textContent = (mode && label)
            ? (mode === 'hourly'
                ? `Filtering by Hour: ${label}`
                : `Filtering by Day: ${label}`)
            : 'No time filter active';
    }

    return {
        updateIndicator
    };
}
