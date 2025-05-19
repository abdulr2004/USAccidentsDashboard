// filter component for year filter

export function createYearFilter(containerId, onYearChange) {
    let availableYears = [];
    let selectedYear = null;
    let yearSelect = null; 
    
    function initialize(years) {
        // Add "All Years" option to available years
        availableYears = ["All Years", ...years.sort()];
        
        // Set initial selection to the most recent year
        selectedYear = availableYears[availableYears.length - 1];
        
        const container = document.getElementById(containerId);
        
        const filterContainer = document.createElement('div');
        filterContainer.className = 'year-filter-container';
        
        const filterLabel = document.createElement('div');
        filterLabel.className = 'filter-label';
        filterLabel.textContent = 'Year';
        
        yearSelect = document.createElement('select');
        yearSelect.id = 'global-year-select';
        yearSelect.className = 'year-select';
        
        availableYears.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });
        
        yearSelect.value = selectedYear;
        
        yearSelect.addEventListener('change', function() {
            selectedYear = this.value;
            if (onYearChange) {
                onYearChange(selectedYear);
            }
        });
        
        filterContainer.appendChild(filterLabel);
        filterContainer.appendChild(yearSelect);
        container.appendChild(filterContainer);
        
    }

    function setValue(year) {
        if (yearSelect) {
            yearSelect.value = year;
            selectedYear = year;
            
            
            if (onYearChange) {
                console.log("YearFilter: Setting year to", year);
                onYearChange(year);
            }
        } else {
            console.error("YearFilter: Cannot set value before initialization");
        }
    }
    
    return {
        initialize: initialize,
        getSelectedYear: () => selectedYear,
        setValue: setValue
    };
}