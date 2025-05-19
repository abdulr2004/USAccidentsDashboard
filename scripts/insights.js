export function drawPositiveStory(data) {
    const severityData = d3.rollup(
      data.filter(d => (+d.Severity === 3 || +d.Severity === 4) && +d.Year !== 2023),//Counting only 3and4 and not in 2023
      v => v.length,
      d => +d.Year
    );
    const chartData = Array.from(severityData, ([Year, SeverityCount]) => ({ Year, SeverityCount }))
      .sort((a, b) => a.Year - b.Year);

    
    const width = 600, height = 400, margin = { top: 50, right: 20, bottom: 70, left: 50 };
    const svg = d3.select("#positive-story")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom) 
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    
    const x = d3.scaleLinear()
      .domain(d3.extent(chartData, d => d.Year))
      .range([0, width]);
    const y = d3.scaleLinear()
      .domain([0, 500]) //changed to 500 cause value above 450 causes issue
      .range([height, 0]);

    
    const line = d3.line()
      .x(d => x(d.Year))
      .y(d => y(d.SeverityCount));
    svg.append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", "green")
      .attr("stroke-width", 2)
      .attr("d", line);

    
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .tickFormat(d3.format("d"))
        .ticks(chartData.length) 
        .tickValues(chartData.map(d => d.Year)) 
      );
    svg.append("g")
      .call(d3.axisLeft(y));

    
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .text("A declining trend in severe accidents")
      .attr("font-size", "16px")
      .attr("font-weight", "bold");
}


export function drawNegativeStory(data) {
      // Counting only rainy weather appearences 
    const rainData = data.filter(d =>
      (d.Weather_Condition === "Rain" ||
       d.Weather_Condition === "Light Rain" ||
       d.Weather_Condition === "Heavy Rain") &&
      +d.Year !== 2023
    );

    // Severity 1 and 2 only- minor accidents
    const yearlyData = d3.rollup(
      rainData.filter(d => +d.Severity === 1 || +d.Severity === 2),
      v => v.length,
      d => +d.Year
    );

    
    const chartData = Array.from(yearlyData, ([Year, TotalCount]) => ({
      Year,
      TotalCount
    })).sort((a, b) => a.Year - b.Year);

    const width = 600, height = 400, margin = { top: 50, right: 20, bottom: 70, left: 50 };
    const svg = d3.select("#negative-story")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom) 
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(chartData.map(d => d.Year))
      .range([0, width])
      .padding(0.1);
    const y = d3.scaleLinear()
      .domain([0, 100]) 
      .range([height, 0]);

    // Draw bars
    svg.selectAll(".bar")
      .data(chartData)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.Year))
      .attr("y", d => y(d.TotalCount))
      .attr("height", d => height - y(d.TotalCount))
      .attr("width", x.bandwidth())
      .attr("fill", "gray");

    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));
    svg.append("g")
      .call(d3.axisLeft(y));

    // Title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .text("Minor Accidents on Rainy Days Get Worse")
      .attr("font-size", "16px")
      .attr("font-weight", "bold");
}
