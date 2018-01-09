var width = 2, height = 0.2;
var border = 1;
var bordercolor = 'black';

// The maximum size that a circle may be - translates to radius of 150 px
const maxSize = 400;

var svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', "0 0 1000 600")
    //.attr('width', width)
    .append('g')
    .attr("transform", 'translate(500, 300)');


var defs = svg.append("defs");

var radiusScale = d3.scaleSqrt().domain([0, 100]).range([30, 100]);

// Collection of forces
var xForce = d3.forceX(width / 2).strength(0.05);
var yForce = d3.forceY(height / 2).strength(0.05);
var manyBodyForce = d3.forceManyBody().strength(function (d) {
    return -0.07 * Math.pow(radiusScale(d.data.size), 2);
});

// Define the force simulation and attach these forces
var simulation = d3.forceSimulation()
    .force('x', xForce)
    .force('y', yForce)
    .force('charge', manyBodyForce);


d3.queue()
    .defer(d3.json, 'images.json')
    .await(ready);

function ready(err, root) {

    if (err) throw(err);

    root = d3.hierarchy(root);

    /*
      root.leaves gives us all the final children (hence leaves) of each child in root.children
       So essentially we are making a flat hierarchial structure
       Each node represents a question, with its category accesible through its node.parent
    */
    var nodes = root.leaves();

    // Initialize the force simulation with the nodes as objects to act upon.
    // Let the simulation call the tick function for every clock cycle
    simulation.nodes(nodes).on('tick', tick);

    defs.selectAll(".image-pattern")
        .data(nodes)
        .enter().append("pattern")
        .attr('class', 'image-pattern')
        .attr("id", function (d) {
            return d.data.name;
        })
        .attr('height', '100%')
        .attr('width', '100%')
        .attr('patternContentUnits', 'objectBoundingBox')
        .append('image')
        .attr('height', 1)
        .attr('width', 1)
        .attr('preserveAspectRatio', 'none')
        .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
        .attr('xlink:href', function (d) {
            return d.data.path;
        });

    // These nodes will be a grouper for the circles and text
    // Then we can apply transformation functions to the nodes and
    // it will be applied to both.
    var svgNodes = svg.selectAll('.node')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('id', function (d) {
            return d.data.name
        })
        .on('click', click);

    svgNodes.append('circle')
        .attr('r', function (d) {
            return radiusScale(d.data.size);
        })
        .style('fill', function (d) {
            return 'url(#' + d.data.name + ')';

        });

    /**
     * Function that gets called on each time tick.
     */
    function tick() {
        svgNodes.attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
    }

    function click(d) {
        // If the bubble is already enlarged
        if (d.data['activated']) {
            // Return bubble back to original size
            d3.select(this)
                .select('circle')
                .transition()
                .duration(300)
                .attr('r', function (d) {
                    return radiusScale(d.data['old_value']);
                });
            //  Update its value in the node
            d.data.size = d.data['old_value'];
            d.data['activated'] = false;

        } else {
            // Save the old value for setting back to original size
            d.data['activated'] = true;
            d.data['old_value'] = d.data.size;

            d.data.size = maxSize;

            // Set this node to have max size
            // Enlarge this circle
            d3.select(this)
                .select('circle')
                .transition()
                .duration(500)
                .attr('r', function (d) {
                    return radiusScale(d.data.size);
                });
        }

        // Update the nodes used by the simulation to calculate forces
        simulation.nodes(nodes);

        // TODO: Figure out why after expansion some bubbles are overlapping.
        // Restart the simulation
        simulation.alphaTarget(1).restart();

    }
}
