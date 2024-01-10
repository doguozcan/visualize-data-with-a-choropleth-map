import "./App.css";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { useEffect, useRef } from "react";

function App() {
  const mapContainer = useRef(null);

  useEffect(() => {
    const width = 1000;
    const height = 650;

    const svg = d3
      .select(mapContainer.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const path = d3.geoPath();

    d3.json(
      "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json"
    ).then((countyData) => {
      d3.json(
        "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json"
      ).then((educationData) => {
        const geoData = topojson.feature(
          countyData,
          countyData.objects.counties
        );

        const combinedData = geoData.features.map((county) => {
          const data = educationData.find((edu) => edu.fips === county.id);

          return {
            ...county,
            state: data ? data.state : null,
            area_name: data ? data.area_name : null,
            education: data ? data.bachelorsOrHigher : null,
          };
        });

        const legend = svg
          .append("g")
          .attr("id", "legend")
          .attr("transform", "translate(900, 200)");
        const legendWidth = 20;

        const minEducation = d3.min(combinedData, (d) => d.education);
        const maxEducation = d3.max(combinedData, (d) => d.education);

        const thresholdValues = d3.range(
          minEducation,
          maxEducation,
          (maxEducation - minEducation) / 10
        );

        const colorScale = d3
          .scaleSequential(d3.interpolateGreens)
          .domain([minEducation, maxEducation]);

        const colors = thresholdValues.map((d) => colorScale(d));

        legend
          .insert("rect", ":first-child")
          .attr("x", 18)
          .attr("y", 18)
          .attr("width", 140)
          .attr("height", legendWidth * 12.5)
          .style("fill", "white");

        legend
          .selectAll("rect")
          .data(colors)
          .enter()
          .append("rect")
          .attr("x", 20)
          .attr("y", (_, i) => 20 + i * (legendWidth + 5))
          .attr("width", legendWidth)
          .attr("height", legendWidth)
          .attr("fill", (d) => d);

        const legendText = thresholdValues.map(
          (d) => `${Math.round(d * 10) / 10}%`
        );

        legend
          .selectAll("text")
          .data(legendText)
          .enter()
          .append("text")
          .attr("x", 50)
          .attr("y", (_, i) => 35 + i * (legendWidth + 5))
          .text((d) => d);

        const tooltip = d3
          .select("#tooltip")
          .attr("id", "tooltip")
          .style("opacity", 0)
          .style("position", "absolute")
          .style("pointer-events", "none")
          .style("background-color", "black")
          .style("color", "white")
          .style("border", "2px solid white")
          .style("border-radius", "10px")
          .style("padding", "5px")
          .style("width", "200px");

        svg
          .selectAll("path")
          .data(combinedData)
          .enter()
          .append("path")
          .attr("d", (d) => path(d))
          .attr("fill", (d) =>
            d.education ? colorScale(d.education) : "white"
          )
          .attr("data-fips", (d) => d.id)
          .attr("data-education", (d) => d.education)
          .attr("class", "county")
          .on("mouseenter", function (event, d) {
            d3.select(this).attr("stroke", "black").attr("stroke-width", 1);
            tooltip
              .attr("data-education", d.education)
              .html(`${d.area_name}, ${d.state} ${d.education}%`)
              .style("opacity", 0.75)
              .style("left", event.pageX + "px")
              .style("top", event.pageY + "px");
          })
          .on("mouseleave", function () {
            d3.select(this).attr("stroke", "none");
            tooltip.style("opacity", 0);
          });
      });
    });
    svg.selectAll("path").attr("stroke", "white").attr("stroke-width", 0.5);
  }, []);
  return (
    <div className="App">
      <h1 id="title">United States Educational Attainment</h1>
      <h3 id="description">
        Percentage of adults age 25 and older with a bachelor's degree or higher
        (2010-2014)
      </h3>
      <div ref={mapContainer} className="map-container"></div>
      <div id="tooltip"></div>
      <p style={{ textAlign: "right", padding: 15 }}>
        Source:{" "}
        <a href="https://www.ers.usda.gov/data-products/county-level-data-sets/download-data.aspx">
          USDA Economic Research Service
        </a>
      </p>
    </div>
  );
}

export default App;
