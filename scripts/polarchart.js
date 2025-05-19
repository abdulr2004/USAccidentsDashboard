export function createPolarAccidentChart(containerId, dataPath, onSliceClick = null) {
    const width = 500, height = 500;
    const radius = Math.min(width, height) / 2 - 50;
    const barColor = "#57000a";
    const highlightColor = "#9c1602";
    let currentMode = "hourly";
    let currentYear = "All Years";
    let currentSeverity = null;
    let selectedSlice = null; // Track the currently selected slice

    async function loadData(year, severity) {
        try {
            const rawData = await d3.csv(dataPath);
            
            // Filter data by year if a specific year is selected
            let filteredData = year === "All Years" ? rawData : rawData.filter(d => d.Year === year);

            if (severity) {
                filteredData = filteredData.filter(d => d.Severity === severity);
            }
            // Process data: count accidents per hour
            let hourlyData = Array(24).fill(0);
            filteredData.forEach(d => {
                const hour = parseInt(d.Hour);
                if (!isNaN(hour) && hour >= 0 && hour < 24) {
                    hourlyData[hour]++;
                }
            });
            hourlyData = hourlyData.map((count, hour) => ({ label: `${hour}:00`, value: count }));

            // Process Daily Data
            let dailyData = { "Sunday": 0, "Monday": 0, "Tuesday": 0, "Wednesday": 0, "Thursday": 0, "Friday": 0, "Saturday": 0 };
            filteredData.forEach(d => {
                if (d.Day_of_Week in dailyData) {
                    dailyData[d.Day_of_Week]++;
                }
            });
            dailyData = Object.entries(dailyData).map(([day, count]) => ({ label: day, value: count }));

            return { hourlyData, dailyData };
        } catch (error) {
            console.error("Error loading data:", error);
            return { hourlyData: [], dailyData: [] };
        }
    }

    function updateSelection(svg, selectedLabel) {
        svg.selectAll(".bar")
            .attr("fill", d => d.label === selectedLabel ? highlightColor : barColor)
            .attr("opacity", d => d.label === selectedLabel ? 1 : 0.3)
            .attr("stroke", d => d.label === selectedLabel ? "#fff" : "none");
            
        svg.selectAll(".label")
            .attr("font-weight", d => d.label === selectedLabel ? "bold" : "normal")
            .attr("fill", d => d.label === selectedLabel ? "#000" : "#333");
    }

    async function drawChart(year, severity = null) {
        const { hourlyData, dailyData } = await loadData(year, severity);
        let data = currentMode === "hourly" ? hourlyData : dailyData;

        // Clear previous chart
        d3.select(`#${containerId}`).select("svg").remove();

        // Append centered SVG
        const svg = d3.select(`#${containerId}`)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("display", "block")
            .style("margin", "auto")
            .append("g")
            .attr("transform", `translate(${width / 2},${height / 2})`);

        // Scales
        const angleScale = d3.scaleBand()
            .domain(data.map(d => d.label))
            .range([0, 2 * Math.PI])
            .padding(0);

        const radiusScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value)])
            .range([20, radius]);

        // Tooltip
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "#fff")
            .style("padding", "5px 10px")
            .style("border-radius", "5px")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("opacity", 0);

        // Add Circular Grid
        const gridLines = 4;
        const gridRadiusStep = radius / gridLines;
        for (let i = 1; i <= gridLines; i++) {
            svg.append("circle")
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", gridRadiusStep * i)
                .style("fill", "none")
                .style("stroke", "#757474")
                .style("stroke-dasharray", "4,4");
        }

        // Add Radial Gridlines
        data.forEach((d, i) => {
            const angle = angleScale(d.label);
            const x = Math.cos(angle - Math.PI / 2) * radius;
            const y = Math.sin(angle - Math.PI / 2) * radius;

            svg.append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", x)
                .attr("y2", y)
                .style("stroke", "#757474")
                .style("stroke-dasharray", "4,4");
        });

        // Bars
        svg.selectAll(".bar")
            .data(data)
            .enter()
            .append("path")
            .attr("class", "bar")
            .attr("d", d => {
                const startAngle = angleScale(d.label);
                const endAngle = startAngle + angleScale.bandwidth();
                const arc = d3.arc()
                    .innerRadius(20)
                    .outerRadius(radiusScale(d.value))
                    .startAngle(startAngle)
                    .endAngle(endAngle);
                return arc();
            })
            .attr("fill", barColor)
            .attr("stroke", "none")
            .attr("opacity", 1)
            .on("click", function(event, d) {
                event.preventDefault();
                selectedSlice = d.label;
                updateSelection(svg, selectedSlice);
                
                if (onSliceClick) {
                    onSliceClick(selectedSlice);
                }
            
                // Show tooltip on click
                tooltip
                  .html(`<strong>${d.label}</strong><br>Accidents: ${d.value}`)
                  .style("left", `${event.pageX + 10}px`)
                  .style("top", `${event.pageY - 28}px`)
                  .transition().duration(200).style("opacity", 1);
            
                // Auto-hide after 2.5 seconds
                clearTimeout(tooltip._hideTimeout);
                tooltip._hideTimeout = setTimeout(() => {
                  tooltip.transition().duration(500).style("opacity", 0);
                }, 500);
            })
            
            .on("mouseover", function(event, d) {
                if (!selectedSlice || selectedSlice === d.label) {
                    d3.select(this).attr("fill", highlightColor);
                }
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`<strong>${d.label}</strong><br>Accidents: ${d.value}`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mousemove", function(event) {
                tooltip.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mouseout", function(event, d) {
                if (!selectedSlice || selectedSlice !== d.label) {
                    d3.select(this).attr("fill", barColor);
                }
                tooltip.transition().duration(200).style("opacity", 0);
            });

        // Labels
        svg.selectAll(".label")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => Math.cos(angleScale(d.label) - Math.PI / 2) * (radius + 25))
            .attr("y", d => Math.sin(angleScale(d.label) - Math.PI / 2) * (radius + 25))
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "#333")
            .text(d => d.label);

        // Apply initial selection if any
        if (selectedSlice && data.some(d => d.label === selectedSlice)) {
            updateSelection(svg, selectedSlice);
        }
    }

    function toggleChartMode() {
        currentMode = currentMode === "hourly" ? "daily" : "hourly";
        drawChart(currentYear, currentSeverity);
    }
    
    function getCurrentMode() {
        return currentMode;
    }

    function updateChart(year, severity = null) {
        currentYear = year;
        currentSeverity = severity;
        drawChart(year, severity);
    }
    
    drawChart(currentYear);
    return { toggleChartMode, updateChart, getCurrentMode };
}