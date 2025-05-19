export function createAccidentsByStateChart(containerId, dataPath) {
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    // const width = 800;
    // const height = 500;
    const width = 750 - margin.left - margin.right;
    const stateHeight = 40;
    const visibleStates = 8;
    let rawData = [];
    let currentData = [];
    let currentStartIndex = 0;

    function initializeChart() {
        const titleDiv = document.createElement('div');
        titleDiv.className = 'chart-title';
        titleDiv.textContent = '';

        const chartWrapper = document.createElement('div');
        chartWrapper.id = 'state-chart-wrapper';
        chartWrapper.className = 'chart-wrapper';

        const chartContainer = document.createElement('div');
        chartContainer.id = 'state-chart-container';
        chartContainer.className = 'chart-container';

        const scrollbarContainer = document.createElement('div');
        scrollbarContainer.id = 'state-scrollbar-container';
        scrollbarContainer.className = 'scrollbar-container';

        const scrollTrack = document.createElement('div');
        scrollTrack.className = 'scroll-track';

        const scrollThumb = document.createElement('div');
        scrollThumb.className = 'scroll-thumb';
        scrollThumb.setAttribute('data-index', '0');

        const upButton = document.createElement('div');
        upButton.className = 'scroll-button scroll-up';
        upButton.innerHTML = '▲';

        const downButton = document.createElement('div');
        downButton.className = 'scroll-button scroll-down';
        downButton.innerHTML = '▼';

        scrollTrack.appendChild(scrollThumb);
        scrollbarContainer.appendChild(upButton);
        scrollbarContainer.appendChild(scrollTrack);
        scrollbarContainer.appendChild(downButton);

        chartWrapper.appendChild(chartContainer);
        chartWrapper.appendChild(scrollbarContainer);

        const container = document.getElementById(containerId);
        container.innerHTML = '';
        container.appendChild(titleDiv);
        container.appendChild(chartWrapper);

        setupScrollbar();
    }

    async function loadData() {
        try {
            rawData = await d3.csv(dataPath);
            return {
                years: [...new Set(rawData.map(d => d.Year))].sort()
            };
        } catch (error) {
            console.error('Error loading data:', error);
            document.getElementById('state-chart-container').innerHTML = 
                `<p>Error loading data: ${error.message}</p>`;
            return { years: [] };
        }
    }

    function updateChart(year, severity = null, timeMode = null, timeLabel = null) {
        currentStartIndex = 0;

        let filtered = rawData;
        if (year !== 'All Years') filtered = filtered.filter(d => d.Year === year);
        if (severity) filtered = filtered.filter(d => d.Severity === severity);

        if (timeLabel && timeMode) {
            if (timeMode === "hourly") {
                const hourVal = timeLabel.split(":")[0];
                filtered = filtered.filter(d => d.Hour === hourVal);
            } else if (timeMode === "daily") {
                filtered = filtered.filter(d => d.Day_of_Week === timeLabel);
            }
        }

        const counts = d3.rollup(filtered, v => v.length, d => d.State);
        currentData = Array.from(counts, ([state, accidents]) => ({ state, accidents }))
            .sort((a, b) => b.accidents - a.accidents);

        createVisibleStatesChart(0);
        updateScrollThumb();
    }

    function createVisibleStatesChart(startIndex) {
        d3.select("#state-chart-container").html("");

        if (currentData.length === 0) {
            d3.select("#state-chart-container")
                .append("div")
                .attr("class", "no-data-message")
                .text("No data available for the selected filters");
            return;
        }

        const visibleData = currentData.slice(startIndex, startIndex + visibleStates);
        const height = visibleStates * stateHeight;

        const svg = d3.select("#state-chart-container")
            .append("svg")
            .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("width", "100%")         // Let the parent container define final size
            .style("height", "auto")
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        

        const x = d3.scaleLinear()
            .domain([0, d3.max(currentData, d => d.accidents) * 1.1])
            .range([0, width]);

        const y = d3.scaleBand()
            .domain(visibleData.map(d => d.state))
            .range([0, height])
            .padding(0.2);

        svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(5));

        svg.append("text")
            .attr("class", "axis-title")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 5)
            .text("Accidents");

        svg.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(y));

        let tooltip = d3.select("body").select(".tooltip");
        if (tooltip.empty()) {
            tooltip = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);
        }

        svg.selectAll(".bar")
            .data(visibleData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("y", d => y(d.state))
            .attr("height", y.bandwidth())
            .attr("x", 0)
            .attr("width", d => x(d.accidents))
            .style("fill", "#550000")
            .on("mouseover", function(event, d) {
                d3.select(this).style("fill", "#990000");

                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);

                tooltip.html(`<strong>${d.state}</strong>: ${d.accidents} accidents`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).style("fill", "#550000");

                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        svg.selectAll(".label")
            .data(visibleData)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d.accidents) + 5)
            .attr("y", d => y(d.state) + y.bandwidth() / 2 + 4)
            .attr("font-size", "12px")
            .text(d => d.accidents);
    }

    function setupScrollbar() {
        const scrollTrack = document.querySelector('#state-chart-wrapper .scroll-track');
        const scrollThumb = document.querySelector('#state-chart-wrapper .scroll-thumb');
        const upButton = document.querySelector('#state-chart-wrapper .scroll-up');
        const downButton = document.querySelector('#state-chart-wrapper .scroll-down');

        upButton.addEventListener('click', function() {
            if (currentStartIndex > 0) {
                currentStartIndex--;
                scrollThumb.setAttribute('data-index', currentStartIndex);
                updateScrollThumb();
                createVisibleStatesChart(currentStartIndex);
            }
        });

        downButton.addEventListener('click', function() {
            const maxIndex = Math.max(0, currentData.length - visibleStates);
            if (currentStartIndex < maxIndex) {
                currentStartIndex++;
                scrollThumb.setAttribute('data-index', currentStartIndex);
                updateScrollThumb();
                createVisibleStatesChart(currentStartIndex);
            }
        });

        document.getElementById('state-chart-container').addEventListener('wheel', function(e) {
            e.preventDefault();

            const maxIndex = Math.max(0, currentData.length - visibleStates);

            if (e.deltaY > 0 && currentStartIndex < maxIndex) {
                currentStartIndex = Math.min(maxIndex, currentStartIndex + 1);
            } else if (e.deltaY < 0 && currentStartIndex > 0) {
                currentStartIndex = Math.max(0, currentStartIndex - 1);
            } else {
                return;
            }

            scrollThumb.setAttribute('data-index', currentStartIndex);
            updateScrollThumb();
            createVisibleStatesChart(currentStartIndex);
        });

        // Setup thumb dragging
        let isDragging = false;
        let startY = 0;
        let startThumbTop = 0;

        scrollThumb.addEventListener('mousedown', function(e) {
            isDragging = true;
            startY = e.clientY;
            startThumbTop = parseFloat(scrollThumb.style.top || 0);
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });

        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;

            const deltaY = e.clientY - startY;
            const trackHeight = scrollTrack.clientHeight;
            const thumbHeight = scrollThumb.clientHeight;
            const availableTrackHeight = trackHeight - thumbHeight;
            let newTop = Math.max(0, Math.min(availableTrackHeight, startThumbTop + deltaY));

            scrollThumb.style.top = `${newTop}px`;

            const maxIndex = Math.max(0, currentData.length - visibleStates);
            currentStartIndex = Math.round((newTop / availableTrackHeight) * maxIndex);
            scrollThumb.setAttribute('data-index', currentStartIndex);

            createVisibleStatesChart(currentStartIndex);
        });

        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                document.body.style.userSelect = '';
            }
        });
    }

    function updateScrollThumb() {
        const scrollThumb = document.querySelector('#state-chart-wrapper .scroll-thumb');
        const scrollTrack = document.querySelector('#state-chart-wrapper .scroll-track');

        if (!scrollThumb || !scrollTrack) return;

        const thumbSizeRatio = Math.min(1, visibleStates / Math.max(1, currentData.length));
        const trackHeight = scrollTrack.clientHeight;
        const thumbHeight = Math.max(30, thumbSizeRatio * trackHeight);

        scrollThumb.style.height = `${thumbHeight}px`;

        const maxIndex = Math.max(0, currentData.length - visibleStates);
        if (maxIndex === 0) {
            scrollThumb.style.top = '0px';
            return;
        }

        const availableTrackHeight = trackHeight - thumbHeight;
        const positionRatio = currentStartIndex / maxIndex;
        const thumbTop = positionRatio * availableTrackHeight;

        scrollThumb.style.top = `${thumbTop}px`;
    }

    initializeChart();

    return {
        loadData,
        updateChart
    };
}
