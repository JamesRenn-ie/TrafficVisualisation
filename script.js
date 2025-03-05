const canvas = document.getElementById("trafficCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 100;

// Node types
const NODE_TYPES = {
    SOURCE: 'source',
    SINK: 'sink',
    NEUTRAL: 'neutral'
};

let nodes = []; // Stores intersections with type and traffic
let edges = []; // Stores roads with capacity and current flow

let selectedNode = null;
let mouseX = 0, mouseY = 0;

// Configuration parameters
const CONFIG = {
    SOURCE_RATE: 10,         // Traffic added by source nodes per second
    SINK_RATE: 5,            // Traffic removed by sink nodes per second
    MAX_EDGE_CAPACITY: 100,  // Maximum capacity of an edge
    FLOW_UPDATE_INTERVAL: 500 // Update flow every 500ms
};

canvas.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

canvas.addEventListener("click", (event) => {
    let clickedNode = findClosestNode(event.clientX, event.clientY);

    if (clickedNode) {
        selectedNode = clickedNode;
    } else {
        selectedNode = null;
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "s" || event.key === "S") {
        // Add source node
        addNode(mouseX, mouseY, NODE_TYPES.SOURCE);
    } else if (event.key === "k" || event.key === "K") {
        // Add sink node
        addNode(mouseX, mouseY, NODE_TYPES.SINK);
    } else if (event.key === "n" || event.key === "N") {
        // Add neutral node
        addNode(mouseX, mouseY, NODE_TYPES.NEUTRAL);
    } else if (event.key === "r" || event.key === "R") {
        if (selectedNode) {
            addRoadFromSelected();
        }
    }
});

function findClosestNode(x, y, threshold = 10) {
    return nodes.find(node => Math.hypot(node.x - x, node.y - y) < threshold);
}

function addNode(x, y, type) {
    const id = nodes.length;
    nodes.push({ 
        id, 
        x, 
        y, 
        type, 
        traffic: 0 
    });
    return id;
}

function addRoadFromSelected() {
    let targetNode = findClosestNode(mouseX, mouseY);

    if (targetNode && targetNode.id !== selectedNode.id) {
        // Add edge with random initial capacity
        addEdge(selectedNode.id, targetNode.id, Math.random() * CONFIG.MAX_EDGE_CAPACITY);
        selectedNode = targetNode;
    } else {
        // Create new node and connect
        let newNode = addNode(mouseX, mouseY, NODE_TYPES.NEUTRAL);
        addEdge(selectedNode.id, newNode, Math.random() * CONFIG.MAX_EDGE_CAPACITY);
        selectedNode = nodes[newNode];
    }

    drawGraph();
}

function addEdge(startNode, endNode, capacity) {
    if (startNode === endNode) return; // Prevent loops

    // Check if edge already exists in either direction
    const existingEdge = edges.find(
        e => (e.startNode === startNode && e.endNode === endNode) ||
             (e.startNode === endNode && e.endNode === startNode)
    );

    if (!existingEdge) {
        edges.push({ 
            startNode,     // First connected node
            endNode,       // Second connected node
            capacity, 
            forwardFlow: 0,   // Flow from startNode to endNode
            reverseFlow: 0    // Flow from endNode to startNode
        });
    }
}

function updateNetworkFlow() {
    console.log("--- Start of Network Flow Update ---");
    
    // Source nodes generate traffic
    const sourceNodes = nodes.filter(node => node.type === NODE_TYPES.SOURCE);
    sourceNodes.forEach(source => {
        const connectedEdges = edges.filter(
            edge => edge.startNode === source.id || edge.endNode === source.id
        );
        
        console.log(`Source ${source.id} connected edges:`, connectedEdges);
        
        if (connectedEdges.length > 0) {
            const trafficPerEdge = CONFIG.SOURCE_RATE / connectedEdges.length;
            
            connectedEdges.forEach(edge => {
                console.log(`Before flow: Edge from ${edge.startNode} to ${edge.endNode}`);
                console.log(`  Forward Flow: ${edge.forwardFlow}, Reverse Flow: ${edge.reverseFlow}, Capacity: ${edge.capacity}`);
                
                if (edge.startNode === source.id) {
                    const flowToAdd = Math.min(
                        trafficPerEdge, 
                        edge.capacity - edge.forwardFlow
                    );
                    edge.forwardFlow += flowToAdd;
                    console.log(`  Added ${flowToAdd} to forward flow`);
                } else {
                    const flowToAdd = Math.min(
                        trafficPerEdge, 
                        edge.capacity - edge.reverseFlow
                    );
                    edge.reverseFlow += flowToAdd;
                    console.log(`  Added ${flowToAdd} to reverse flow`);
                }
                
                console.log(`After flow: Edge from ${edge.startNode} to ${edge.endNode}`);
                console.log(`  Forward Flow: ${edge.forwardFlow}, Reverse Flow: ${edge.reverseFlow}`);
            });
        }
    });

    // Neutral nodes redistribute traffic
    const neutralNodes = nodes.filter(node => node.type === NODE_TYPES.NEUTRAL);
    neutralNodes.forEach(neutral => {
        const connectedEdges = edges.filter(
            edge => edge.startNode === neutral.id || edge.endNode === neutral.id
        );
        
        console.log(`Neutral ${neutral.id} connected edges:`, connectedEdges);
        
        // More aggressive traffic redistribution
        let totalAvailableTraffic = connectedEdges.reduce(
            (total, edge) => total + (edge.startNode === neutral.id ? edge.forwardFlow : edge.reverseFlow), 
            0
        );
        
        console.log(`Total available traffic: ${totalAvailableTraffic}`);
        
        if (totalAvailableTraffic > 0) {
            const otherEdges = connectedEdges.filter(
                edge => (edge.startNode === neutral.id && edge.forwardFlow > 0) || 
                        (edge.endNode === neutral.id && edge.reverseFlow > 0)
            );
            
            console.log(`Edges with traffic:`, otherEdges);
            
            if (otherEdges.length > 1) {
                const trafficPerEdge = totalAvailableTraffic / otherEdges.length;
                
                otherEdges.forEach(currentEdge => {
                    console.log(`Redistributing from ${currentEdge.startNode} to ${currentEdge.endNode}`);
                    
                    if (currentEdge.startNode === neutral.id) {
                        const flowToMove = Math.min(currentEdge.forwardFlow, trafficPerEdge);
                        currentEdge.forwardFlow -= flowToMove;
                        
                        // Find a different connected edge to move traffic to
                        const targetEdge = connectedEdges.find(
                            e => e !== currentEdge && 
                                 (e.startNode === neutral.id || e.endNode === neutral.id)
                        );
                        
                        if (targetEdge) {
                            if (targetEdge.startNode === neutral.id) {
                                targetEdge.forwardFlow += flowToMove;
                            } else {
                                targetEdge.reverseFlow += flowToMove;
                            }
                        }
                    } else {
                        const flowToMove = Math.min(currentEdge.reverseFlow, trafficPerEdge);
                        currentEdge.reverseFlow -= flowToMove;
                        
                        const targetEdge = connectedEdges.find(
                            e => e !== currentEdge && 
                                 (e.startNode === neutral.id || e.endNode === neutral.id)
                        );
                        
                        if (targetEdge) {
                            if (targetEdge.startNode === neutral.id) {
                                targetEdge.forwardFlow += flowToMove;
                            } else {
                                targetEdge.reverseFlow += flowToMove;
                            }
                        }
                    }
                });
            }
        }
    });

    // Sink nodes remove traffic
    const sinkNodes = nodes.filter(node => node.type === NODE_TYPES.SINK);
    sinkNodes.forEach(sink => {
        const connectedEdges = edges.filter(
            edge => edge.startNode === sink.id || edge.endNode === sink.id
        );
        
        connectedEdges.forEach(edge => {
            if (edge.startNode === sink.id) {
                // Remove from forward flow
                const trafficToRemove = Math.min(
                    edge.forwardFlow, 
                    CONFIG.SINK_RATE
                );
                edge.forwardFlow -= trafficToRemove;
            } else {
                // Remove from reverse flow
                const trafficToRemove = Math.min(
                    edge.reverseFlow, 
                    CONFIG.SINK_RATE
                );
                edge.reverseFlow -= trafficToRemove;
            }
        });
    });

    drawGraph();
}

function drawGraph() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw edges
    edges.forEach(edge => {
        let start = nodes[edge.startNode];
        let end = nodes[edge.endNode];
        
        // Total flow calculation
        let totalFlow = edge.forwardFlow + edge.reverseFlow;
        let flowPercentage = totalFlow / edge.capacity;
        
        let color = `rgb(${flowPercentage * 255}, ${(1 - flowPercentage) * 255}, 0)`;

        ctx.strokeStyle = color;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Flow percentage text
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.fillText(
            `${(flowPercentage * 100).toFixed(1)}%`, 
            (start.x + end.x) / 2, 
            (start.y + end.y) / 2
        );
    });

    // Draw nodes
    nodes.forEach(node => {
        switch(node.type) {
            case NODE_TYPES.SOURCE:
                ctx.fillStyle = "green";
                break;
            case NODE_TYPES.SINK:
                ctx.fillStyle = "red";
                break;
            default:
                ctx.fillStyle = "white";
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, 10, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Initial setup
addNode(canvas.width / 2, canvas.height / 2, NODE_TYPES.NEUTRAL);

// Update network flow and redraw
setInterval(updateNetworkFlow, CONFIG.FLOW_UPDATE_INTERVAL);
drawGraph();