export function drawDonutChart(selectedYear = "all", onSliceClick = null, timeMode = null, timeLabel = null) {
    const width = 500, height = 500, radius = Math.min(width, height) / 2;
    const color = d3.scaleSequential()
        .domain([0.5, 4.5])
        .interpolator(d3.interpolateBlues);

    d3.select("#donut-chart").html("");

    const titleDiv = d3.select("#donut-chart")
        .append("div")
        .attr("class", 'chart-title')
        .text('');

    const svgContainer = d3.select("#donut-chart")
        .append("div")
        .attr("class", "svg-container");

    const svg = svgContainer.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    d3.csv("data/cleaned_accidents_dataset.csv").then(data => {
        data.forEach(d => d.Year = +d.Year);
        let filteredData = selectedYear === "all" ? data : data.filter(d => d.Year === +selectedYear);

        if (timeLabel && timeMode) {
            if (timeMode === "hourly") {
                const hourVal = timeLabel.split(":")[0];
                filteredData = filteredData.filter(d => d.Hour === hourVal);
            } else if (timeMode === "daily") {
                filteredData = filteredData.filter(d => d.Day_of_Week === timeLabel);
            }
        }

        const severityCounts = d3.rollup(filteredData, v => v.length, d => d.Severity);
        const pieData = Array.from(severityCounts, ([key, value]) => ({ key, value }));

        const pie = d3.pie().value(d => d.value);
        const arc = d3.arc().innerRadius(radius * 0.5).outerRadius(radius);

        let tooltip = d3.select("body").select(".donut-tooltip");
        if (tooltip.empty()) {
            tooltip = d3.select("body").append("div")
                .attr("class", "donut-tooltip tooltip")
                .style("opacity", 0);
        }

        svg.selectAll(".arc")
            .data(pie(pieData))
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", d => color(d.data.key))
            .attr("stroke", "white")
            .on("mouseover", function (event, d) {
                d3.select(this).attr("opacity", 0.8).attr("stroke-width", 2);
                const total = d3.sum(pieData, d => d.value);
                const percentage = ((d.data.value / total) * 100).toFixed(1);
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(`<strong>Severity: ${d.data.key}</strong><br>Count: ${d.data.value}<br>Percentage: ${percentage}%`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mousemove", function (event) {
                tooltip.style("left", (event.pageX + 10) + "px")
                       .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
                d3.select(this).attr("opacity", 1).attr("stroke-width", 1);
                tooltip.transition().duration(500).style("opacity", 0);
            })
            .on("click", function (event, d) {
                event.preventDefault();
                if (onSliceClick) onSliceClick(d.data.key);
            });

        const total = d3.sum(pieData, d => d.value);

        svg.selectAll(".donut-label")
            .data(pie(pieData))
            .enter()
            .append("text")
            .attr("class", "donut-label")
            .attr("transform", d => {
                const cent = arc.centroid(d);
                const midAngle = Math.atan2(cent[1], cent[0]);
                const x = Math.cos(midAngle) * (radius * 0.7);
                const y = Math.sin(midAngle) * (radius * 0.7);
                return `translate(${x},${y})`;
            })
            .attr("text-anchor", "middle")
            .attr("dy", ".35em")
            .style("font-weight", "bold")
            .style("fill", "#fff")
            .text(d => {
                const percentage = ((d.data.value / total) * 100).toFixed(0);
                const label = `Severity ${d.data.key}`;
                return percentage > 5 ? label : "";
            });

        const legend = svg.selectAll(".legend")
            .data(pieData)
            .enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => `translate(${radius + 10},${-radius + 30 + i * 20})`);

        legend.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", d => color(d.key));

        legend.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .text(d => {
                const percentage = ((d.value / total) * 100).toFixed(1);
                return `Severity ${d.key} (${percentage}%)`;
            });

        svg.append("text")
            .attr("class", "year-indicator")
            .attr("text-anchor", "start")
            .attr("x", radius + 10)
            .attr("y", radius - 10)
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text(selectedYear !== "all" ? `Year: ${selectedYear}` : 'All Years');
    }).catch(error => {
        console.error("Error loading or processing data:", error);
        d3.select("#donut-chart").append("p")
            .text(`Error loading data: ${error.message}`);
    });
}

export function populateYearDropdown() {
    console.log("Using global year filter instead of individual dropdown");
}

export function initialize() {
    console.log("Donut chart module initialized");
}
