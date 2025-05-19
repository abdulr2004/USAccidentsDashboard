//Component for Monthly Distribution of Accidents Line Chart

export function createMonthlyAccidentsChart(containerId, dataPath) {
    const margin = { top: 40, right: 120, bottom: 60, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 425 - margin.top - margin.bottom;

    let rawData = [];

    function initializeChart() {
        const titleDiv = document.createElement('div');
        titleDiv.className = 'chart-title';
        titleDiv.textContent = '';

        const chartContainer = document.createElement('div');
        chartContainer.id = 'monthly-chart-container';
        chartContainer.className = 'line-chart-container';

        const container = document.getElementById(containerId);
        container.innerHTML = '';
        container.appendChild(titleDiv);
        container.appendChild(chartContainer);
    }

    async function loadData() {
        try {
            rawData = await d3.csv(dataPath);
            const years = [...new Set(rawData.map(d => d.Year))].sort();
            return { years };
        } catch (error) {
            console.error('Error loading data:', error);
            document.getElementById('monthly-chart-container').innerHTML = 
                `<p>Error loading data: ${error.message}</p>`;
            return { years: [] };
        }
    }

    function updateChart(year, severity = null, timeMode = null, timeLabel = null) {
        let filteredData = rawData;

        if (year !== "All Years") {
            filteredData = filteredData.filter(d => d.Year === year);
        }

        if (severity) {
            filteredData = filteredData.filter(d => d.Severity === severity);
        }

        if (timeLabel && timeMode) {
            if (timeMode === "hourly") {
                const hourVal = timeLabel.split(":")[0];
                filteredData = filteredData.filter(d => d.Hour === hourVal);
            } else if (timeMode === "daily") {
                filteredData = filteredData.filter(d => d.Day_of_Week === timeLabel);
            }
        }

        if (filteredData.length === 0) {
            console.warn(`No data available for filters: year=${year}, severity=${severity}, time=${timeLabel}`);
            d3.select("#monthly-chart-container").html('<p class="no-data-message">No data for selected filters.</p>');
            return;
        }

        const monthlyData = [];
        for (let month = 1; month <= 12; month++) {
            const monthStr = month.toString();
            const monthData = filteredData.filter(d => d.Month === monthStr);
            monthlyData.push({ month, count: monthData.length });
        }

        createLineChart(monthlyData, year);
    }

    function createLineChart(monthlyData, year) {
        d3.select("#monthly-chart-container").html("");

        const svg = d3.select("#monthly-chart-container")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        svg.append("text")
            .attr("class", "chart-subtitle")
            .attr("x", width / 2)
            .attr("y", -margin.top / 2)
            .attr("text-anchor", "middle")
            .text("Monthly Distribution of Accidents");

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const x = d3.scaleLinear().domain([1, 12]).range([0, width]);
        const minCount = d3.min(monthlyData, d => d.count);
        const maxCount = d3.max(monthlyData, d => d.count);
        const yDomain = [0, maxCount * 1.1];
        const y = d3.scaleLinear().domain(yDomain).range([height, 0]);

        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(12).tickFormat(d => monthNames[d - 1]));

        svg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(12).tickSize(-height).tickFormat(""))
            .selectAll("line").style("stroke", "#e0e0e0");

        svg.append("g").attr("class", "y-axis").call(d3.axisLeft(y));

        svg.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(""))
            .selectAll("line").style("stroke", "#e0e0e0");

        svg.append("text")
            .attr("class", "axis-title")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 20)
            .attr("x", -height / 2)
            .text("Number of Accidents");

        const line = d3.line()
            .x(d => x(d.month))
            .y(d => y(d.count))
            .curve(d3.curveMonotoneX);

        let tooltip = d3.select("body").select(".line-tooltip");
        if (tooltip.empty()) {
            tooltip = d3.select("body").append("div")
                .attr("class", "line-tooltip tooltip")
                .style("opacity", 0);
        }

        svg.append("path")
            .datum(monthlyData)
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", "#4285F4")
            .attr("stroke-width", 2.5)
            .attr("d", line);

        svg.selectAll(".dot")
            .data(monthlyData)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("cx", d => x(d.month))
            .attr("cy", d => y(d.count))
            .attr("r", 4)
            .on("mouseover", function (event, d) {
                d3.select(this).transition().duration(200).attr("r", 6);
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(`<strong>${monthNames[d.month - 1]}</strong><br>${d.count} accidents`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
                d3.select(this).transition().duration(200).attr("r", 4);
                tooltip.transition().duration(500).style("opacity", 0);
            });

        svg.append("text")
            .attr("class", "year-label")
            .attr("x", width)
            .attr("y", -5)
            .attr("text-anchor", "end")
            .text(year);
    }

    initializeChart();

    return {
        loadData,
        updateChart
    };
}
