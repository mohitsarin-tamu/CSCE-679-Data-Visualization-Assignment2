// Level 2 solution
// setting margins width and height
const margin = { top: 50, right: 50, bottom: 50, left: 100 },
    width = 900 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// creating SVG container for proper functioning and positioning
const heatmap_plot = d3.select("#heatmap-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// defining scales
const x_scale = d3.scaleBand().range([0, width]).padding(0.05);
const y_scale = d3.scaleBand().range([0, height]).padding(0.05);
const color_scale = d3.scaleSequential(d3.interpolateOrRd);

// setting up tooltip for proper hovering boxes
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("opacity", 0) 
    .style("background", "white")
    .style("color", "black") 
    .style("padding", "6px 10px") 
    .style("font-size", "14px")
    .style("font-family", "Arial, sans-serif")
    .style("box-shadow", "2px 2px 5px rgba(0, 0, 0, 0.2)") 
    .style("pointer-events", "none") 
    .style("min-width", "100px"); 

// importing and extracting data from the given csv file
d3.csv("temperature_daily.csv").then(function (data) {
    // Preprocess data
    data = data.map(d => ({
        date: new Date(d.date),
        year: new Date(d.date).getFullYear(),
        month: new Date(d.date).getMonth(),
        day: new Date(d.date).getDate(),
        max_temperature: +d.max_temperature || 0,
        min_temperature: +d.min_temperature || 0
    })).filter(d => d.year >= 1997); // Filter to desired years

    // getting last 10 years data for visualization
    const last10year = d3.max(data, d => d.year);
    const last10year_data = data.filter(d => d.year >= last10year - 10);
    
    // extracting years and months
    const years = [...new Set(last10year_data.map(d => d.year))];
    const months = d3.range(12);
    x_scale.domain(years);
    y_scale.domain(months);
    color_scale.domain([
        d3.min(last10year_data, d => d.min_temperature), 
        d3.max(last10year_data, d => d.max_temperature)
    ]);

    const cellWidth = x_scale.bandwidth();
    const cellHeight = y_scale.bandwidth();

    // grouping the data year-month wise
    const grouped_data = d3.group(last10year_data, d => `${d.year}-${d.month}`);

    // createing heat map cells with line charts inside it
    grouped_data.forEach((values, key) => {
        const [year, month] = key.split("-").map(Number);

        if (!years.includes(year) || !months.includes(month)) return;
        
        const cellGroup = heatmap_plot.append("g")
            .attr("transform", `translate(${x_scale(year)},${y_scale(month)})`);

        // scale for charts insides the cell
        const xSubScale = d3.scaleLinear()
            .domain([1, 31])
            .range([0, cellWidth]);
            
        const ySubScale = d3.scaleLinear()
            .domain([
                d3.min(values, d => d.min_temperature), 
                d3.max(values, d => d.max_temperature)
            ])
            .range([cellHeight, 0]);

        // generate 2 lines for max and min temperature respectively
        const line_maxtemp = d3.line()
            .x(d => xSubScale(d.day))
            .y(d => ySubScale(d.max_temperature));

        const line_mintemp = d3.line()
            .x(d => xSubScale(d.day))
            .y(d => ySubScale(d.min_temperature));

        // mean monthly temperature
        const avg_maxmonthlytemp = d3.mean(values, d => d.max_temperature);
        const avg_minmonthlytemp = d3.mean(values, d => d.min_temperature);
        
        // monthly maximum and minimum temperatures
        const monthlyMaxTemp = d3.max(values, d => d.max_temperature);
        const monthlyMinTemp = d3.min(values, d => d.min_temperature);

        // adding the cell 
        cellGroup.append("rect")
            .attr("width", cellWidth)
            .attr("height", cellHeight)
            // fill te cell color with mean temperature
            .attr("fill", color_scale(avg_maxmonthlytemp))
        
            // mouseover, is the hover function which controls how the data is displayed 
            // when the pointer is moved over the cell
            .on("mouseover", function (event) {
                tooltip.transition().duration(200).style("opacity", 0.9);
                
                // formatting the tooltip content with monthly max and min data
                tooltip.html(`
                    Date: ${year}-${String(month + 1).padStart(2, "0")},
                    Max: ${monthlyMaxTemp.toFixed(1)}°C,
                    Min: ${monthlyMinTemp.toFixed(1)}°C
                `)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 25) + "px");
            })
            .on("mousemove", function (event) {
                tooltip.style("left", (event.pageX + 15) + "px")
                       .style("top", (event.pageY - 25) + "px");
            })
            .on("mouseout", function () {
                tooltip.transition().duration(500).style("opacity", 0);
            });

        // adding mini line charts
        cellGroup.append("path")
            .datum(values)
            .attr("d", line_maxtemp)
            .attr("stroke", "green")
            .attr("stroke-width", 1)
            .attr("fill", "none");
            
        cellGroup.append("path")
            .datum(values)
            .attr("d", line_mintemp)
            .attr("stroke", "lightblue")
            .attr("stroke-width", 1)
            .attr("fill", "none");
    });

    // adding the X and Y Axes
    // formatting the axes to look similar to the sample image
    heatmap_plot.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x_scale).tickFormat(d3.format("d")));
        
    heatmap_plot.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Year");
        
    heatmap_plot.append("g")
        .call(d3.axisLeft(y_scale).tickFormat(m => d3.timeFormat("%B")(new Date(2000, m, 1))));
        
    heatmap_plot.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Month");
        
    // adding the legend_map for colors scale
    const legend_map = heatmap_plot.append("g")
        .attr("transform", `translate(${width - 100}, -40)`);
        
    const legend_mapScale = d3.scaleLinear()
        .domain(color_scale.domain())
        .range([0, 100]);
        
    const legend_mapAxis = d3.axisBottom(legend_mapScale)
        .ticks(5)
        .tickFormat(d => `${d.toFixed(0)}`);

    legend_map.selectAll("rect")
        .data(d3.range(10))
        .enter().append("rect")
        .attr("x", d => d * 10)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", d => color_scale(legend_mapScale.invert(d * 10)));

    legend_map.append("g")
        .attr("transform", "translate(0,10)")
        .call(legend_mapAxis);
        
    legend_map.append("text")
        .attr("x", 40)
        .attr("y", -2)
        .style("text-anchor", "middle")
        .style("font-size", "10px")
        .text("Temperature(°C)");

    // adding the legend_map for minimum and maximum temperature
    const lineLegend_map = heatmap_plot.append("g")
        .attr("transform", `translate(${width - 250}, -50)`);

    lineLegend_map.append("line")
        .attr("x1", 0)
        .attr("x2", 30)
        .attr("y1", 10)
        .attr("y2", 10)
        .attr("stroke", "green")
        .attr("stroke-width", 2);

    lineLegend_map.append("text")
        .attr("x", 40)
        .attr("y", 13)
        .style("font-size", "12px")
        .text("Max Temperature");

    lineLegend_map.append("line")
        .attr("x1", 0)
        .attr("x2", 30)
        .attr("y1", 30)
        .attr("y2", 30)
        .attr("stroke", "lightblue")
        .attr("stroke-width", 2);

    lineLegend_map.append("text")
        .attr("x", 40)
        .attr("y", 33)
        .style("font-size", "12px")
        .text("Min Temperature");
});
