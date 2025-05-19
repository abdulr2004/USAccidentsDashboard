export function createHeatmap(containerId, csvFilePath, topoFilePath, initialYear = "All Years") {
  const width = 960;
  const height = 600;
  let unfilteredData = [];
  let svg = null;
  let projection = null;
  let densityNodes = null;
  let colorScale = null;
  
  svg = d3.select(`#${containerId}`)
    .append("svg")
    .attr("width", width)
    .attr("height", height);
    
  projection = d3.geoAlbersUsa()
    .translate([width / 2, height / 2])
    .scale(1000);
    
  const path = d3.geoPath().projection(projection);
  
  // Loading datasets
  Promise.all([
    d3.json(topoFilePath),
    d3.csv(csvFilePath)
  ]).then(([usTopo, csvData]) => {
    // Store all data for filtering
    unfilteredData = csvData;
    
    // Converting TopoJSON to GeoJSON
    const usStates = topojson.feature(usTopo, usTopo.objects.states);
    
    // Drawing US state borders
    svg.append("g")
      .selectAll("path")
      .data(usStates.features)
      .enter().append("path")
      .attr("d", path)
      .attr("fill", "lightgray")
      .attr("stroke", "black")
      .attr("stroke-width", 0.5);
      
    // Setting upp Zooom
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        const transform = event.transform;
        svg.selectAll("g")
          .attr("transform", transform);
      });
    svg.call(zoom);
    
    console.log("Heatmap: Initial render with year:", initialYear);
    updateChart(initialYear, null, null, null);
  }).catch(error => {
    console.error("Error loading the data:", error);
  });
  
  function updateChart(year, severity, timeMode, timeLabel) {
    console.log("Heatmap updateChart -> Year:", year, "Severity:", severity);
    
    // dataa filter
    const filteredData = unfilteredData.filter(d => {
      if (year !== "All Years" && d.Year !== year) return false;
      if (severity && d.Severity !== severity.toString()) return false;
      return true;
    });
    
    const accidents = filteredData.map(d => ({
      lat: +d.Start_Lat,
      lon: +d.Start_Lng,
      count: 1
    })).filter(d => {
      
      return !isNaN(d.lat) && !isNaN(d.lon) && 
             d.lat >= 24 && d.lat <= 50 && 
             d.lon >= -125 && d.lon <= -66; 
    });
        svg.selectAll(".density-node").remove();
    
    const gridSize = 0.1; //Changedd to make circle small
    const densityData = {};
    accidents.forEach(accident => {
      const key = `${Math.floor(accident.lat / gridSize)}-${Math.floor(accident.lon / gridSize)}`;
      if (densityData[key]) {
        densityData[key].count += 1;
      } else {
        densityData[key] = { lat: accident.lat, lon: accident.lon, count: 1 };
      }
    });
    const densityArray = Object.values(densityData);
    
//color
    colorScale = d3.scaleLinear()
      .domain([0, d3.max(densityArray, d => d.count) || 1])
      .range(["blue", "blue"]);
    
    densityNodes = svg.append("g")
      .attr("class", "density-points")
      .selectAll(".density-node")
      .data(densityArray)
      .enter().append("circle")
      .attr("class", "density-node")
      .attr("cx", d => {
        const pos = projection([d.lon, d.lat]);
        return pos ? pos[0] : null;
      })
      .attr("cy", d => {
        const pos = projection([d.lon, d.lat]);
        return pos ? pos[1] : null;
      })
      .attr("r", 3)
      .attr("fill", d => colorScale(d.count))
      .attr("opacity", 0.7);
    
    densityNodes
      .append("title")
      .text(d => `${d.count} accidents in this area`);
  }
    return { updateChart };
}