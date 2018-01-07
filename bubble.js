var width = 1000, height = 1000;

var svg = d3.select('#chart')
    .append('svg')
    .attr('height', height)
    .attr('width', width)
    .append('g');

var defs = svg.append("defs");

var radiusScale = d3.scaleSqrt().domain([0, 100]).range([30, 100]);

// Collection of forces
var xForce = d3.forceX(width / 2).strength(0.05);
var yForce = d3.forceY(height / 2).strength(0.05);
var manyBodyForce = d3.forceManyBody().strength(function (d) {
    const force = Math.floor(Math.random() * 50);
    return -0.07 * Math.pow(radiusScale(force), 2);

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
        .attr("id", function(d) {
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
        .attr('xlink:href', function(d) {
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
        .attr('r', function () {
            return radiusScale(Math.floor(Math.random()*50));
        })
        .style('fill', function (d) {
            return 'url(#' + d.data.name +')';

        });

    /**
     * Function that gets called on each time tick.
     */
    function tick() {
        svgNodes.attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
    }

    /**
     * Checks if any other bubbles are expanded and collapses them if they are
     * @param d
     */
    function clickCheck(d) {
        // First check if any other bubble were expanded
        var expandedNode = nodes.find(function (node) {
            return node.data['activated'] === true;
        });

        if (expandedNode) {
            // Decrease the size of the expanded circle
            d3.select("#" + expandedNode.data.name)
                .select('circle')
                .transition()
                .duration(300)
                .attr('r', function (d) {
                    return radiusScale(d.data['old_value']);
                });
            //  Update its value in the node
            expandedNode.data.value = expandedNode.data['old_value'];
            expandedNode.data['activated'] = false;
        }
    }

    function click(d) {

        clickCheck(d);

        if (d.data['activated']) {
            d3.select(this)
                .select('circle')
                .transition()
                .duration(300)
                .attr('r', function (d) {
                    return radiusScale(d.data['old_value']);
                });
        } else {
            // The maximum value that any circle will have (not radius)
            // this translates to a radius of 80
            // TODO: Refactor this to be varants elsewhere
            var v = 300;

            // Save the old value for setting back to original size
            d.data['activated'] = true;
            d.data['old_value'] = d.data.value;

            // Set this node to have max size
            d.data.value = v;

            // Enlarge this circle
            d3.select(this)
                .select('circle')
                .transition()
                .duration(500)
                .attr('r', function (d) {
                    return radiusScale(d.data.value);
                });
        }

        // Update the nodes used by the simulation to calculate forces
        simulation.nodes(nodes);

        // TODO: Figure out why after expansion some bubbles are overlapping.
        // Restart the simulation
        simulation.alphaTarget(1).restart();
    }
}

function getColours() {
    return {
        "INDOOR": '#ff9587',
        "OUTDOOR": '#0dce72',
        "LIFESTYLE": 'lightblue'
    };
}