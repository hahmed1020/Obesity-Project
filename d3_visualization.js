const margin = { top: 70, right: 150, bottom: 60, left: 70 },
      width = 900 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .style("font-family", "'EB Garamond', serif")
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

d3.csv("Obesity prediction.csv").then(data => {
  const counts = d3.rollups(
    data,
    v => v.length,
    d => d.CAEC,
    d => d.Obesity
  );

  const stackedData = counts.map(([caec, levels]) => {
    const row = { CAEC: caec };
    levels.forEach(([obesity, count]) => {
      row[obesity] = count;
    });
    return row;
  });

  const keys = Array.from(new Set(data.map(d => d.Obesity)));

  const x = d3.scaleBand()
    .domain(["no", "Sometimes", "Frequently", "Always"])
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(stackedData, d => d3.sum(keys, k => d[k] || 0))])
    .nice()
    .range([height, 0]);

  //  Colorblind-friendly palette (Color Universal Design)
  const color = d3.scaleOrdinal()
    .domain(keys)
    .range([
      "#c6dbef", // orange
      "#9ecae1", // sky blue
      "#6baed6", // bluish green
      "#4292c6", // yellow
      "#2171b5", // blue
      "#08519c", // vermillion
      "#08306b"  // reddish purple
    ]);

  const stacked = d3.stack()
    .keys(keys)
    .value((d, key) => d[key] || 0)(stackedData);

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

  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("visibility", "hidden")
    .style("position", "absolute")
    .style("background", "#f9f9f9")
    .style("padding", "8px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("font-size", "13px");

  svg.selectAll("g.layer")
    .data(stacked)
    .join("g")
    .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(d => d)
    .join("rect")
    .attr("x", d => x(d.data.CAEC))
    .attr("y", d => y(d[1]))
    .attr("height", d => y(d[0]) - y(d[1]))
    .attr("width", x.bandwidth())
    .on("mouseover", function (event, d) {
      const obesity = d3.select(this.parentNode).datum().key;
      const count = d[1] - d[0];
      tooltip
        .html(`<strong>Obesity:</strong> ${obesity}<br><strong>CAEC:</strong> ${d.data.CAEC}<br><strong>Count:</strong> ${count}`)
        .style("visibility", "visible");
    })
    .on("mousemove", event => {
      tooltip
        .style("top", `${event.pageY - 40}px`)
        .style("left", `${event.pageX + 20}px`);
    })
    .on("mouseout", () => tooltip.style("visibility", "hidden"));

  const legend = svg.selectAll(".legend")
    .data(keys)
    .enter()
    .append("g")
    .attr("transform", (d, i) => `translate(${width + 20}, ${i * 22})`);

  legend.append("rect")
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", d => color(d));

  legend.append("text")
    .attr("x", 20)
    .attr("y", 12)
    .style("font-size", "13px")
    .text(d => d);
});
