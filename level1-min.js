// D3.js Heatmap for Visualizing Temperature Data

// creating function to create heatmap based on the backgroud fill type
function drawHeatmap(background_filltype) {

    // setting margins width and height
    const margin = { top: 50, right: 50, bottom: 50, left: 100 },
        width = 900 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // create SVG container for plotting the heatmap
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
        .style("pointer-events", "none"); 

    // importing and extracting data from the given csv file
    d3.csv("temperature_daily.csv").then(function (data) {
        data = data.map(d => ({
            date: new Date(d.date),
            year: new Date(d.date).getFullYear(),
            month: new Date(d.date).getMonth(),
            max_temperature: +d.max_temperature || 0,
            min_temperature: +d.min_temperature || 0,
        })).filter(d => d.year >= 1997);

        // grouping data by year and month and calculating min and max temperatures
        // month wise
        const montly_data = d3.rollup(
            data,
            v => ({
                maxTemp: d3.max(v, d => d.max_temperature),
                minTemp: d3.min(v, d => d.min_temperature)
            }),
            d => d.year,
            d => d.month
        );
        const years = [...montly_data.keys()];
        const months = d3.range(12);

        x_scale.domain(years);
        y_scale.domain(months);
        color_scale.domain([
            d3.min([...montly_data.values()].flatMap(months => [...months.values()].map(d => d.minTemp))),
            d3.max([...montly_data.values()].flatMap(months => [...months.values()].map(d => d.maxTemp)))
        ]);

        // storing the calculated data
        const monthly_data = [];
        montly_data.forEach((months, year) => {
            months.forEach((temps, month) => {
                monthly_data.push({
                    year: year,
                    month: month,
                    max_temperature: temps.maxTemp,
                    min_temperature: temps.minTemp
                });
            });
        });

        // drawing the heatmap
        heatmap_plot.selectAll(".cell")
            .data(monthly_data)
            .enter().append("rect")
            .attr("x", d => x_scale(d.year))
            .attr("y", d => y_scale(d.month))
            .attr("width", x_scale.bandwidth())
            .attr("height", y_scale.bandwidth())
            // background_filltype is the input parameter for this function, heatmap background would change accordingly
            .attr("fill", d => color_scale(d[background_filltype]))

            // mouseover, is the hover function which controls how the data is displayed when the pointer is moved over the cell
            .on("mouseover", function (event, d) {
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html(`Date: ${d.year}-${String(d.month + 1).padStart(2, '0')}; Max: ${d.max_temperature}°C Min: ${d.min_temperature}°C`)
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

        // adding the X and Y Axes
        // formatting the axes to look similar to the sample image
        heatmap_plot.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x_scale).tickFormat(d3.format("d")));
        heatmap_plot.append("text")
        .attr("x", width / 2)  
        .attr("y", height + 40) 
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Year");

        heatmap_plot.append("g").call(d3.axisLeft(y_scale).tickFormat(m => d3.timeFormat("%B")(new Date(2000, m, 1))));
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

    });
}

// draw a heatmap with background color fill as min_temperature
drawHeatmap("min_temperature");

