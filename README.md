# US Accidents Dashboard

The US Accidents Dashboard is a web application developed using D3.js for data visualization. The dashboard provides users with interactive visualizations to explore and analyze US traffic accident data. It includes various charts, maps, and filtering capabilities for comprehensive data exploration.

## Features

- **Multiple Visualizations:** Includes choropleth maps, heatmaps, donut charts, bar charts, line charts, and polar charts for comprehensive data exploration.
- **Filtering:** Users can filter data based on different criteria such as year, severity, time of day, and day of week.
- **Interactive Maps:** Users can explore accident densities across different states and drill down for more detailed information.
- **Top State Analysis:** View the top 3 states with the highest accident counts along with detailed statistics.
- **Temporal Analysis:** Analyze accident trends by month, day of week, or hour of day.

## Getting Started

To run the web application locally, follow these steps:

1. Clone this repository to your local machine.
2. Navigate to the project directory.
3. With VSCode installed, right-click the folder and open the directory.
4. Go to extensions and install the `ritwickdey.LiveServer` extension.
5. Once the extension is installed, click the `Go Live` button while the `index.html` file is open and in focus.

## Usage

Once the application is launched, users will encounter an interactive dashboard showcasing many visualizations. Here's how to navigate and utilize the features:

- **Explore Visualizations:** Navigate between different sections using the sidebar menu.
- **Filter Data:** Use the year, severity, and time filters at the top of the dashboard to tailor the displayed data.
- **Interactive Maps:** Toggle between the choropleth map and heatmap views, zoom in/out, and hover on states to see detailed statistics.
- **Time Analysis:** Use the polar chart to analyze accidents by hour or day, toggling between views as needed.

## Application Architecture

The architecture of the application is structured as follows:

- **index.html:** Serves as the main entry point for the application and anchors all visualizations.
- **styles folder:** Contains the CSS styling files for the dashboard.
  - **Styles.css:** Main stylesheet with dashboard layout, sidebar, charts, and responsive design.
  - **main.css:** Additional styles for charts, scrollbars, tooltips, and insights panels.
- **data folder:** Contains the US Accidents dataset as a CSV file and map data as TopoJSON.
- **scripts folder:** Contains the JavaScript logic for managing the visualization dashboard:
  - **main.js:** Orchestrates the loading of data, initializing and updating charts, and managing filters.
  - **barchart.js:** Creates a scrollable bar chart showing accidents by state.
  - **donutchart.js:** Creates a donut chart visualization of accident severity distribution.
  - **heatmap.js:** Renders a heatmap visualization showing accident density.
  - **insights.js:** Generates special charts highlighting positive and negative trends.
  - **linechart.js:** Creates a line chart showing monthly accident distributions.
  - **polarchart.js:** Creates a polar chart to analyze daily or hourly accident patterns.
  - **severityFilter.js:** Manages the severity filtering component.
  - **spatialmap.js:** Creates a choropleth map with detailed state statistics.
  - **timeFilter.js:** Manages the time (hour/day) filtering component.
  - **yearFilter.js:** Manages the global year selection filter.

On page load, `index.html` loads the `main.js` script, which initializes all visualization components and sets up the filtering system. When filters are applied, respective update functions are triggered to filter the data across all visualizations in real-time.

## Dependencies

- [D3.js](https://d3js.org/) (v7) for data visualization
- [TopoJSON Client](https://github.com/topojson/topojson-client) for map integration

## References

1. US TopoJSON. Available at: [https://github.com/topojson/us-atlas](https://github.com/topojson/us-atlas)