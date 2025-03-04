const canvas = document.getElementById("trafficCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 100;

let nodes = []; // Stores intersections
let edges = []; // Stores roads

let selectedNode = null;
let mouseX = 0, mouseY = 0;

canvas.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

canvas.addEventListener("click", (event) => {
    let clickedNode = findClosestNode(event.clientX, event.clientY);

    if (clickedNode) {
        selectedNode = clickedNode; // Select the clicked node
    } else {
        selectedNode = null; // Deselect if clicking empty space
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "r" || event.key === "R") {
        if (selectedNode) {
            addRoadFromSelected();
        }
    }
});

function findClosestNode(x, y, threshold = 10) {
    return nodes.find(node => Math.hypot(node.x - x, node.y - y) < threshold);
}

function addRoadFromSelected() {
    let targetNode = findClosestNode(mouseX, mouseY);

    if (targetNode && targetNode.id !== selectedNode.id) {
        // If the cursor is on an existing node, connect to it
        addEdge(selectedNode.id, targetNode.id);
        selectedNode = targetNode; // Set new selection to this node
    } else {
        // Otherwise, create a new node and connect to it
        let newNode = addNode(mouseX, mouseY);
        addEdge(selectedNode.id, newNode);
        selectedNode = nodes[newNode]; // Set the new node as the selected node
    }

    drawGraph();
}

// Add a node with a specific type (source, sink, or neutral)
function addNode(x, y, type = 'neutral') {
    const id = nodes.length;
    nodes.push({ id, x, y, type, demandIn: 0, demandOut: 0 });
    return id;
}

function addEdge(startNode, endNode) {
    if (startNode === endNode) return; // Prevent loops
    edges.push({ startNode, endNode, traffic: Math.random() });
}

// Create initial nodes (1 source, 1 neutral, and 1 sink)
addNode(canvas.width / 2, canvas.height / 2, 'source');  // Source Node
addNode(canvas.width / 3, canvas.height / 3, 'neutral');  // Neutral Node
addNode(2 * canvas.width / 3, canvas.height / 3, 'sink');  // Sink Node

function calculateTrafficFlow() {
    edges.forEach(edge => {
        const startNode = nodes[edge.startNode];
        const endNode = nodes[edge.endNode];

        let flow = 0;

        // Handle source node: always create traffic
        if (startNode.type === 'source') {
            flow = Math.min(startNode.demandOut, edge.traffic * 100); // Flow is limited by demandOut or road capacity
            edge.traffic = flow;  // Update road traffic
            startNode.demandOut -= flow;  // Subtract traffic generated
        }

        // Handle sink node: always consume traffic
        else if (endNode.type === 'sink') {
            flow = Math.min(endNode.demandIn, edge.traffic * 100);  // Flow is limited by demandIn or road capacity
            edge.traffic = flow;  // Update road traffic
            endNode.demandIn -= flow;  // Subtract traffic consumed
        }

        // Handle neutral node: traffic is transferred based on road capacity
        else if (startNode.type === 'neutral' && endNode.type === 'neutral') {
            flow = Math.min(edge.traffic * 100, Math.min(startNode.demandOut, endNode.demandIn));
            edge.traffic = flow;  // Update road traffic
            startNode.demandOut -= flow;  // Subtract traffic transferred
            endNode.demandIn -= flow;  // Add traffic to destination node
        }

        // Update the nodes after flow calculation
        endNode.demandIn += flow;  // Add traffic to the destination node
        startNode.demandOut -= flow;  // Subtract traffic from the start node
    });

    // Print the results of the flow calculation
    console.log("Traffic Flow Calculation:");
    edges.forEach(edge => {
        console.log(`Road from Node ${edge.startNode} to Node ${edge.endNode}: ${edge.traffic} traffic`);
    });
}

function drawGraph() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges (roads)
    edges.forEach(edge => {
        let start = nodes[edge.startNode];
        let end = nodes[edge.endNode];
        let color = `rgb(${edge.traffic * 255}, ${255 - edge.traffic * 255}, 0)`;

        ctx.strokeStyle = color;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
    });

    // Draw nodes (intersections)
    nodes.forEach(node => {
        let nodeColor = node.type === 'source' ? 'green' : node.type === 'sink' ? 'red' : 'white';
        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Simulate traffic changes
function updateTraffic() {
    // Loop through edges to calculate traffic flow for each road
    edges.forEach(edge => {
        const startNode = nodes[edge.startNode];
        const endNode = nodes[edge.endNode];

        // Handle source node: always generate traffic
        if (startNode.type === 'source') {
            let generatedTraffic = Math.min(startNode.demandOut, 1); // Limit generated traffic to demandOut
            edge.traffic = generatedTraffic;
            startNode.demandOut -= generatedTraffic; // Subtract traffic generated
        }
        // Handle sink node: always consume traffic
        else if (endNode.type === 'sink') {
            let consumedTraffic = Math.min(endNode.demandIn, edge.traffic); // Limit consumed traffic to demandIn
            edge.traffic = consumedTraffic;
            endNode.demandIn -= consumedTraffic; // Subtract traffic consumed
        }
        // Handle neutral node: just transfer traffic
        else if (startNode.type === 'neutral' && endNode.type === 'neutral') {
            let flowThrough = Math.min(edge.traffic, Math.min(startNode.demandOut, endNode.demandIn));
            edge.traffic = flowThrough;
            startNode.demandOut -= flowThrough;  // Subtract traffic transferred
            endNode.demandIn -= flowThrough;  // Add traffic to destination node
        }
    });

    // Update the flow for each node: demandOut decreases for source nodes and demandIn decreases for sink nodes
    nodes.forEach(node => {
        if (node.type === 'source') {
            node.demandOut = Math.min(node.demandOut, 1); // Limit max outgoing traffic from source
        }
        if (node.type === 'sink') {
            node.demandIn = Math.min(node.demandIn, 1); // Limit max incoming traffic to sink
        }
    });

    // Redraw the graph after traffic update
    drawGraph();
}


setInterval(updateTraffic, 1000);
drawGraph();
