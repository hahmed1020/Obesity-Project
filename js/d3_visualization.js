const margin = { top: 70, right: 150, bottom: 60, left: 70 },
      width = 700 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .style("font-family", "'EB Garamond', serif")
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const obesityLevels = [
  "Insufficient_Weight",
  "Normal_Weight",
  "Overweight_Level_I",
  "Overweight_Level_II",
  "Obesity_Type_I",
  "Obesity_Type_II",
  "Obesity_Type_III"
];

const color = d3.scaleOrdinal()
  .domain(obesityLevels)
  .range([
    "#c6dbef", 
    "#9ecae1",
    "#6baed6",
    "#4292c6",
    "#2171b5",
    "#08519c",
    "#08306b"  
  ]);

d3.csv("Obesity prediction.csv").then(data => {
  const counts = d3.rollups(
    data,
    v => v.length,
    d => d.CAEC,
    d => d.Obesity
  );

  const formattedData = counts.map(([caec, levels]) => {
    const entry = { CAEC: caec };
    levels.forEach(([level, count]) => {
      entry[level] = count;
    });
    return entry;
  });

  const stacked = d3.stack()
    .keys(obesityLevels)
    .value((d, key) => d[key] || 0)(formattedData);

  const x = d3.scaleBand()
    .domain(["no", "Sometimes", "Frequently", "Always"])
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(stacked, s => d3.max(s, d => d[1]))])
    .nice()
    .range([height, 0]);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("font-size", "14px");

  svg.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("font-size", "13px");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 20)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Number of Individuals");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -30)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .text("Snacking Frequency vs. Obesity Level");

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "#f9f9f9")
    .style("padding", "8px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("font-size", "13px");

  svg.selectAll("g.layer")
    .data(stacked)
    .enter()
    .append("g")
    .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(d => d)
    .enter()
    .append("rect")
    .attr("x", d => x(d.data.CAEC))
    .attr("y", d => y(d[1]))
    .attr("height", d => y(d[0]) - y(d[1]))
    .attr("width", x.bandwidth())
    .on("mouseover", function (event, d) {
      const obesity = d3.select(this.parentNode).datum().key;
      const count = d[1] - d[0];
      tooltip.html(
        `<strong>Obesity Level:</strong> ${obesity}<br>
         <strong>Snacking:</strong> ${d.data.CAEC}<br>
         <strong>Count:</strong> ${count}`
      )
      .style("visibility", "visible");
    })
    .on("mousemove", event => {
      tooltip.style("top", `${event.pageY - 40}px`)
             .style("left", `${event.pageX + 20}px`);
    })
    .on("mouseout", () => tooltip.style("visibility", "hidden"));

  const legend = svg.append("g")
    .attr("transform", `translate(${width + 20}, 0)`);

  obesityLevels.forEach((level, i) => {
    const row = legend.append("g")
      .attr("transform", `translate(0, ${i * 22})`);

    row.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", color(level));

    row.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .style("font-size", "13px")
      .text(level);
  });
});
