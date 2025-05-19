import { createAccidentsByStateChart } from './barchart.js';
import { createMonthlyAccidentsChart } from './linechart.js';
import { createYearFilter } from './yearFilter.js';
import { drawDonutChart } from './donutchart.js';
import { createPolarAccidentChart } from './polarchart.js';
import { createSeverityFilter } from './severityFilter.js';
import { createTimeFilter } from './timeFilter.js';
import { drawPositiveStory, drawNegativeStory } from './insights.js';
import { createSpatialMap } from './spatialmap.js';
import { createHeatmap } from './heatmap.js';

let selectedYear = "2023"; //Setting default year as 2023
window.selectedYear = selectedYear; 

let selectedSeverity = null;
let selectedTimeLabel = null;
let mapChart = null;
let heatmapChart = null;
let currentMapMode = 'spatial'; 

let severityFilter;
let timeFilter;

async function initializeDashboard() {
    console.log("Initializing dashboard...");

    // Initializing charts
    const stateChart = createAccidentsByStateChart('state-chart-section', 'data/cleaned_accidents_dataset.csv');
    const monthlyChart = createMonthlyAccidentsChart('line-chart-section', 'data/cleaned_accidents_dataset.csv');
    const polarChart = createPolarAccidentChart(
        'polar-chart-section',
        'data/cleaned_accidents_dataset.csv',
        handleTimeSliceClick
    );

    // Loading years 
    const stateData = await stateChart.loadData();
    const monthlyData = await monthlyChart.loadData();
    const allYears = [...new Set([...stateData.years, ...monthlyData.years])].sort();

    // Filters
    const filterContainer = document.createElement('div');
    filterContainer.id = 'filter-container';
    const sidebar = document.querySelector('.sidebar');
    sidebar.appendChild(filterContainer);

    const yearFilter = createYearFilter('filter-container', handleYearChange);
    yearFilter.initialize(allYears);
    
    // Set the year filter UI to match our default year
    yearFilter.setValue("2023");

    severityFilter = createSeverityFilter('filter-container', () => {
        selectedSeverity = null;
        updateAllCharts();
    });

    timeFilter = createTimeFilter('filter-container', () => {
        selectedTimeLabel = null;
        updateAllCharts();
    });

    function handleYearChange(year) {
        console.log("Year changed to:", year);
        selectedYear = year;
        window.selectedYear = year; 
        updateAllCharts();
    }

    function handleSeverityClick(severity) {
        selectedSeverity = severity === selectedSeverity ? null : severity;
        updateAllCharts();
    }

    function handleTimeSliceClick(label) {
        selectedTimeLabel = label === selectedTimeLabel ? null : label;
        updateAllCharts();
    }

    function updateAllCharts() {
        const timeMode = polarChart.getCurrentMode();

        console.log("updateAllCharts -> Year:", selectedYear, 
                    "Severity:", selectedSeverity, 
                    "Time:", selectedTimeLabel);

        if (severityFilter) severityFilter.updateIndicator(selectedSeverity);
        if (timeFilter) timeFilter.updateIndicator(timeMode, selectedTimeLabel);

        stateChart.updateChart(selectedYear, selectedSeverity, timeMode, selectedTimeLabel);
        monthlyChart.updateChart(selectedYear, selectedSeverity, timeMode, selectedTimeLabel);
        polarChart.updateChart(selectedYear, selectedSeverity);

        const donutYear = selectedYear === 'All Years' ? 'all' : selectedYear;
        drawDonutChart(donutYear, handleSeverityClick, timeMode, selectedTimeLabel);
        
        // Update the current active map
        if (currentMapMode === 'spatial' && mapChart && mapChart.updateChart) {
            mapChart.updateChart(selectedYear, selectedSeverity, timeMode, selectedTimeLabel);
        }
        else if (currentMapMode === 'heatmap' && heatmapChart && heatmapChart.updateChart) {
            heatmapChart.updateChart(selectedYear, selectedSeverity, timeMode, selectedTimeLabel);
        }
    }
    
    // Button for polar chart
    const polarSection = document.getElementById('polar-chart-section');
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = 'Toggle Hourly / Daily';
    toggleBtn.className = 'nav-button';
    toggleBtn.style.margin = '10px auto';
    toggleBtn.style.display = 'block';
    toggleBtn.addEventListener('click', () => {
        polarChart.toggleChartMode();
        selectedTimeLabel = null; 
        updateAllCharts();
    });
    polarSection.insertBefore(toggleBtn, polarSection.firstChild);

    
    mapChart = createSpatialMap(
        'map-container',
        'data/cleaned_accidents_dataset.csv',
        'data/us-states.topojson',
        selectedYear // Pass the initial year
    );
    
    // Vutton for map visualization style
    const mapSection = document.getElementById('map-section');
    const mapToggleBtn = document.createElement('button');
    mapToggleBtn.textContent = 'Toggle Map Style: Choropleth';
    mapToggleBtn.className = 'nav-button';
    mapToggleBtn.style.margin = '10px 0';
    mapToggleBtn.addEventListener('click', toggleMapStyle);
    
    const mapHeading = mapSection.querySelector('h2');
    mapHeading.parentNode.insertBefore(mapToggleBtn, mapHeading.nextSibling);
    
    updateAllCharts();

    // Smooth scrolling for sidebar navigation
    document.querySelectorAll('.sidebar a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // For insight graphs, loading data seperately
    try {
        const insightData = await d3.csv('data/cleaned_accidents_dataset.csv', d => {
            return {
                ...d,
                Severity: +d.Severity,
                Year: +d.Year,
                "Wind_Speed(mph)": +d["Wind_Speed(mph)"] || 0 
            };
        });
        // Draw static insight graphs
        drawPositiveStory(insightData);
        drawNegativeStory(insightData);
    } catch (error) {
        console.error('Error loading data for insights:', error);
        document.getElementById('summary').innerHTML += 
            `<p>Error loading insight graphs: ${error.message}</p>`;
    }
}

// Function to toggle between map styles
function toggleMapStyle() {
    const mapContainer = document.getElementById('map-container');
    const toggleBtn = document.querySelector('#map-section .nav-button');
    
    // Clear the current map
    mapContainer.innerHTML = '';
    
    if (currentMapMode === 'spatial') {
        // Switch to heatmap using the same TopoJSON file - pass the current year
        heatmapChart = createHeatmap(
            'map-container',
            'data/cleaned_accidents_dataset.csv',
            'data/us-states.topojson',
            selectedYear 
        );
        currentMapMode = 'heatmap';
        toggleBtn.textContent = 'Toggle Map Style: Heatmap';
    } else {
        // Switch back to spatial map
        mapChart = createSpatialMap(
            'map-container',
            'data/cleaned_accidents_dataset.csv',
            'data/us-states.topojson',
            selectedYear 
        );
        currentMapMode = 'spatial';
        toggleBtn.textContent = 'Toggle Map Style: Choropleth';
    }
}

document.addEventListener('DOMContentLoaded', initializeDashboard);