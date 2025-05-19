export function createSpatialMap(containerId, csvFilePath, topoFilePath, initialYear = "All Years") {
  const width = 960;
  const height = 600;

  
  const fipsToAbbr = {
    "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","11":"DC","12":"FL",
    "13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME",
    "24":"MD","25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH",
    "34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI",
    "45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI",
    "56":"WY"
  };

  let unfilteredData = [];
  let statesFeatures = [];

  // Create the SVG.
  const svg = d3.select(`#${containerId}`)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Define projection and path.
  const projection = d3.geoAlbersUsa()
    .translate([width / 2, height / 2])
    .scale(1000);
  const path = d3.geoPath().projection(projection);

  // Tooltip.
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 100)
    .style("position", "absolute")
    .style("background", "#000")
    .style("border", "1px solid #ccc")
    .style("padding", "6px")
    .style("border-radius", "4px");

  // States group.
  const gStates = svg.append("g").attr("class", "states");
  let statesSelection = null;

  // Color scale.
  const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, 1]);

  // Legend setup.
  const legendWidth = 200;
  const legendHeight = 10;
  const legendMargin = { top: 20, right: 20, bottom: 0, left: 20 };

  const legendGroup = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${legendMargin.left}, ${legendMargin.bottom})`);

  const defs = svg.append("defs");
  const linearGradient = defs.append("linearGradient")
    .attr("id", "legend-gradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");

  function updateLegend(scale) {
    linearGradient.selectAll("stop").remove();
    linearGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", scale.range()[0]);
    linearGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", scale.range()[1]);
    legendGroup.selectAll("rect").remove();
    legendGroup.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)");
    const legendScale = d3.scaleLinear()
      .domain(scale.domain())
      .range([0, legendWidth]);
    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d3.format(".2s"));
    legendGroup.selectAll(".axis").remove();
    legendGroup.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0, ${legendHeight})`)
      .call(legendAxis);
  }

  // Load CSV and TopoJSON.
  Promise.all([
    d3.csv(csvFilePath),
    d3.json(topoFilePath)
  ])
  .then(([csvData, usTopo]) => {
    unfilteredData = csvData;
    const geo = topojson.feature(usTopo, usTopo.objects.states);
    statesFeatures = geo.features;
    statesSelection = gStates.selectAll("path")
      .data(statesFeatures)
      .join("path")
      .attr("class", "state")
      .attr("d", path)
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.8);
    updateChart(initialYear, null, null, null);
  })
  .catch(err => {
    console.error("Error loading spatial map data:", err);
  });

  // Zoom and pan.
  const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", (event) => {
      gStates.attr("transform", event.transform);
    });
  svg.call(zoom);

  window.toggleFact = function(factIndex) {
    const headerSel = d3.select(`#fact-header-${factIndex}`);
    const bodySel = d3.select(`#fact-body-${factIndex}`);
    const isExpanded = headerSel.classed("expanded");
    headerSel.classed("expanded", !isExpanded);
    bodySel.style("display", isExpanded ? "none" : "block");
  };

  // Build the Insights panel.
  function updateChart(year, severity, timeMode, timeLabel) {
    // 1) Filter data.
    const filtered = unfilteredData.filter(d => {
      if (year !== "All Years" && d.Year !== year) return false;
      if (severity && d.Severity !== severity) return false;
      return true;
    });
    // Roll up accidents by state.
    const accidentsByState = d3.rollup(
      filtered,
      v => v.length,
      d => d.State
    );
    const allStatesMap = new Map();
    for (const feat of statesFeatures) {
      let abbr = fipsToAbbr[feat.id] || feat.id;
      allStatesMap.set(abbr, accidentsByState.get(abbr) || 0);
    }
    // Update color scale.
    const counts = Array.from(allStatesMap.values());
    const maxCount = d3.max(counts);
    colorScale.domain(!maxCount ? [0, 1] : [0, maxCount]);
    updateLegend(colorScale);
    // Update state fills.
    if (statesSelection) {
      statesSelection.transition()
        .duration(600)
        .attr("fill", d => {
          const abbr = fipsToAbbr[d.id] || d.id;
          const c = allStatesMap.get(abbr) || 0;
          return c === 0 ? "#eee" : colorScale(c);
        });
      statesSelection
        .on("mouseover", (event, d) => {
          const abbr = fipsToAbbr[d.id] || d.id;
          const count = allStatesMap.get(abbr) || 0;
          tooltip.style("opacity", 1)
            .html(`
              <strong>${d.properties.name}</strong><br/>
              ${abbr}: ${count} accidents
            `);
        })
        .on("mousemove", (event) => {
          tooltip.style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", () => {
          tooltip.style("opacity", 0);
        });
    }
    // Build the "Top 3 States" panel.
    const totalAccidents = filtered.length;
    let statsHtml = `
      <h2 style="color: #2c3e50; font-size:1.2rem; margin-bottom:10px;">
        Top 3 States
      </h2>
    `;
    if (totalAccidents === 0) {
      statsHtml += `<p>No accidents found for this filter.</p>`;
    } else {
      const statesArray = Array.from(accidentsByState, ([st, cnt]) => ({ state: st, count: cnt }));
      statesArray.sort((a, b) => d3.descending(a.count, b.count));
      const top3 = statesArray.slice(0, 3);
      statsHtml += `<p style="font-size:1rem; margin-bottom:10px;">These states currently lead in accident counts:</p>`;
      top3.forEach((item, i) => {
        const { state, count } = item;
        const stateSubset = filtered.filter(d => d.State === state);
        let statMsg = "";
        if (i === 0) {
          //proportion of total accidents.
          let share = ((count / totalAccidents) * 100).toFixed(1);
          statMsg += `<p>Share of total accidents: <strong>${share}%</strong></p>`;
          const next3Sum = statesArray.slice(1, 4).reduce((acc, cur) => acc + cur.count, 0);
          if (count > next3Sum && next3Sum > 0) {
            statMsg += `<p style="color:#e74c3c; font-style:italic;">That’s more than the next 3 states combined!</p>`;
          }
        } else if (i === 1) {
          // severity accident rate.
          const severeCount = stateSubset.filter(d => +d.Severity >= 3).length;
          const severeRate = (severeCount / stateSubset.length * 100).toFixed(1);
          statMsg += `<p>Severe Accident Rate (Severity ≥ 3): <strong>${severeRate}%</strong></p>`;
        } else if (i === 2) {
          //seasonal breakdown.
          let monthCounts = d3.rollup(stateSubset, v => v.length, d => d.Month);
          let months = Array.from(monthCounts.entries());
          if (months.length > 0) {
            let [peakMonth, peakCount] = months.reduce((a, b) => (a[1] > b[1] ? a : b));
            let share = ((peakCount / stateSubset.length) * 100).toFixed(1);
            const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
            let monthName = monthNames[peakMonth - 1] || `Month ${peakMonth}`;
            statMsg += `<p>Peak Month: <strong>${monthName}</strong> with ${peakCount} accidents (${share}% of ${state}'s accidents)</p>`;
          } else {
            statMsg += `<p>No seasonal data available.</p>`;
          }
        }
        statsHtml += `
          <div style="margin-bottom:10px;">
            <div id="fact-header-${i}"
                 class="fact-header"
                 onclick="toggleFact(${i})"
                 style="font-size:1rem;">
              <span class="arrow">▶</span>
              <span style="color:#e74c3c;">${state} - ${count} accidents</span>
            </div>
            <div id="fact-body-${i}" class="fact-body">
              ${statMsg}
            </div>
          </div>
        `;
      });
      statsHtml += `<p style="font-weight:600; margin-top:8px;">Total accidents in this view: <span style="color:#444; font-size:1.1rem;">${totalAccidents}</span>.</p>`;
    }
    // Stat
    statsHtml += `
      <p style="
        background-color:#ecf6ff;
        padding:10px;
        margin-top:20px;
        border-radius:4px;
        font-size:0.9rem;
        color:#2c3e50;
        border:1px solid #b3d7f2;
      ">
        <strong>Did you know?</strong> According to NHTSA, about <strong>6 million accidents</strong> occur in the U.S. each year, leading to millions of injuries.
      </p>
    `;
    d3.select("#map-stats").html(statsHtml);
  }

  return { updateChart };
}
