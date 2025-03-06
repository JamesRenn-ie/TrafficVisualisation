const canvas = document.getElementById("trafficCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight-100;

let nodes = []; // Stores intersections
let edges = []; // Stores roads

// adding roads at mouse cursor when R pressed
let selectedNode = null;
let mouseX = 0, mouseY = 0;

canvas.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

canvas.addEventListener("click", (event) => {
    let clickedNode = findClosestNode(event.clientX, event.clientY);
    
    if (selectedNode) {
        addRoadFromSelected();
    }

    if (clickedNode) {
        selectedNode = clickedNode; // Select the clicked node
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "r" || event.key === "R") {
        if (selectedNode) {
            selectedNode = null; // set selected to null if 'R' pressed
        }
    }
});

//used to display an unconfirmed road if one exists
function animate() {
    drawGraph();  // Clear and redraw everything
    if (selectedNode) {
        displayUncomfirmedRoad(selectedNode.id);
    }
    requestAnimationFrame(animate); // Continuously updates the screen
}

function findClosestNode(x, y, threshold = 10) {
    return nodes.find(node => Math.hypot(node.x - x, node.y - y) < threshold);
}

//allows you to draw a road from an existing node that is selected
function addRoadFromSelected() {
    let targetNode = findClosestNode(mouseX, mouseY);

    if (targetNode && targetNode.id !== selectedNode.id) {
        // If the cursor is on an existing node, connect to it
        if (canCreateRoad(selectedNode.id, targetNode.id)) {
            addEdge(selectedNode.id, targetNode.id);
            selectedNode = targetNode; // Set new selection to this node
        }
    } else {
        // Check if a road to this new position would be valid
        if (canCreateRoadToPosition(selectedNode.id, mouseX, mouseY)) {
            // Create a new node and connect to it
            let newNode = addNode(mouseX, mouseY);
            addEdge(selectedNode.id, newNode);
            selectedNode = nodes[newNode]; // Set the new node as the selected node
        }
    }

    drawGraph();
}

// Helper function to check if a road can be created between two existing nodes
function canCreateRoad(startNodeId, endNodeId) {
    const start = nodes.find(node => node.id === startNodeId);
    const end = nodes.find(node => node.id === endNodeId);
    
    if (!start || !end) return false;
    
    // Check if this road would pass through any other node
    for (let node of nodes) {
        // Skip the start and end nodes
        if (node.id === startNodeId || node.id === endNodeId) continue;
        
        // Check if this node is on the line segment between start and end
        if (isPointOnLineSegment(start.x, start.y, end.x, end.y, node.x, node.y)) {
            return false;
        }
    }
    
    // Check if this road would intersect with any existing road
    for (let edge of edges) {
        const roadStart = nodes.find(node => node.id === edge.startNode);
        const roadEnd = nodes.find(node => node.id === edge.endNode);
        
        // Skip checking if they share a node (roads naturally intersect at shared nodes)
        if (startNodeId === edge.startNode || startNodeId === edge.endNode || 
            endNodeId === edge.startNode || endNodeId === edge.endNode) {
            continue;
        }
        
        // Check if the lines intersect
        if (doLinesIntersect(
            start.x, start.y, end.x, end.y,
            roadStart.x, roadStart.y, roadEnd.x, roadEnd.y
        )) {
            return false;
        }
    }
    
    return true;
}

// Helper function to check if a road can be created to a new position
function canCreateRoadToPosition(startNodeId, endX, endY) {
    const start = nodes.find(node => node.id === startNodeId);
    
    if (!start) return false;
    
    // Check if this road would pass through any other node
    for (let node of nodes) {
        // Skip the start node
        if (node.id === startNodeId) continue;
        
        // Check if this node is on the line segment between start and new position
        if (isPointOnLineSegment(start.x, start.y, endX, endY, node.x, node.y)) {
            return false;
        }
    }
    
    // Check if this road would intersect with any existing road
    for (let edge of edges) {
        const roadStart = nodes.find(node => node.id === edge.startNode);
        const roadEnd = nodes.find(node => node.id === edge.endNode);
        
        // Skip checking if they share the start node
        if (startNodeId === edge.startNode || startNodeId === edge.endNode) {
            continue;
        }
        
        // Check if the lines intersect
        if (doLinesIntersect(
            start.x, start.y, endX, endY,
            roadStart.x, roadStart.y, roadEnd.x, roadEnd.y
        )) {
            return false;
        }
    }
    
    return true;
}

//will draw a blue road for an unconfirmes road
function displayUncomfirmedRoad(startNodeId) {
    if (startNodeId === null) return;

    let start = nodes.find(node => node.id === startNodeId);
    if (!start) return;
    
    let intersects = false;
    
    // Check if this potential road would pass through any other node
    for (let node of nodes) {
        // Skip the start node
        if (node.id === startNodeId) continue;
        
        // Check if this node is on the line segment between start and mouse
        if (isPointOnLineSegment(start.x, start.y, mouseX, mouseY, node.x, node.y)) {
            intersects = true;
            break;
        }
    }
    
    // Check if this potential road would intersect with any existing road
    if (!intersects) {
        for (let edge of edges) {
            const roadStart = nodes.find(node => node.id === edge.startNode);
            const roadEnd = nodes.find(node => node.id === edge.endNode);
            
            // Skip checking if they share the start node
            if (startNodeId === edge.startNode || startNodeId === edge.endNode) {
                continue;
            }
            
            // Check if the lines intersect
            if (doLinesIntersect(
                start.x, start.y, mouseX, mouseY,
                roadStart.x, roadStart.y, roadEnd.x, roadEnd.y
            )) {
                intersects = true;
                break;
            }
        }
    }
    
    // Use red color if the road would intersect a node or another road
    let color = intersects ? 
        `rgba(255, 0, 0, 0.5)` : 
        `rgba(0, 100, 255, 0.5)`;

    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(mouseX, mouseY);
    ctx.stroke();
}

//add a node at X and Y
function addNode(x, y, type = "normal") {
    const id = nodes.length;
    nodes.push({ id, x, y, type });
    return id;
}

function addEdge(startNode, endNode) {
    if (startNode === endNode) return; // Prevent loops
    
    const start = nodes.find(node => node.id === startNode);
    const end = nodes.find(node => node.id === endNode);
    
    if (!start || !end) return;
    
    // Check if this road would pass through any other node
    for (let node of nodes) {
        // Skip the start and end nodes
        if (node.id === startNode || node.id === endNode) continue;
        
        // Check if this node is on the line segment between start and end
        if (isPointOnLineSegment(start.x, start.y, end.x, end.y, node.x, node.y)) {
            return; // Don't create the road
        }
    }
    
    // Check if this road would intersect with any existing road
    for (let edge of edges) {
        const roadStart = nodes.find(node => node.id === edge.startNode);
        const roadEnd = nodes.find(node => node.id === edge.endNode);
        
        // Skip checking if they share a node (roads naturally intersect at shared nodes)
        if (startNode === edge.startNode || startNode === edge.endNode || 
            endNode === edge.startNode || endNode === edge.endNode) {
            continue;
        }
        
        // Check if the lines intersect
        if (doLinesIntersect(
            start.x, start.y, end.x, end.y,
            roadStart.x, roadStart.y, roadEnd.x, roadEnd.y
        )) {
            return; // Don't create the road
        }
    }
    
    // If we made it here, the road is valid
    edges.push({ startNode, endNode, traffic: 0});
}

// Helper function to determine if a point is on a line segment
function isPointOnLineSegment(x1, y1, x2, y2, px, py, threshold = 5) {
    // Calculate the distance from point to line segment
    const lineLength = Math.hypot(x2 - x1, y2 - y1);
    if (lineLength === 0) return false;
    
    // Calculate distance from point to line
    const t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / (lineLength * lineLength);
    
    // Check if the point projection is on the line segment
    if (t < 0 || t > 1) return false;
    
    // Calculate the projected point
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    
    // Check if the distance from the point to the projection is less than threshold
    const distance = Math.hypot(px - projX, py - projY);
    return distance < threshold;
}

// Add this function to check if two line segments intersect
function doLinesIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    // Calculate the direction of the lines
    const uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
    const uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));

    // If uA and uB are between 0-1, lines are colliding
    return (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1);
}

// Create initial node
addNode(canvas.width / 2, canvas.height / 2, "source");

//add random road when add road button clicked
function addRoad() {
    if (nodes.length === 0) return;

    // Pick a random existing node as the start
    let startNode = nodes[Math.floor(Math.random() * nodes.length)];

    let newNode;
    if (Math.random() < 0.5 && nodes.length > 1) {
        // Connect to another existing node
        do {
            newNode = nodes[Math.floor(Math.random() * nodes.length)];
        } while (newNode.id === startNode.id);
    } else {
        // Create a new node at a random position
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        newNode = { id: nodes.length, x, y };
        nodes.push(newNode);
    }

    addEdge(startNode.id, newNode.id);
    drawGraph();
}

//draws the road network onto the canvas
function drawGraph() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges (roads)
    edges.forEach(edge => {
        let start = nodes[edge.startNode];
        let end = nodes[edge.endNode];
        let color = `rgb(${edge.traffic *0.1 * 255}, ${255 - edge.traffic*0.1 * 255}, 0)`;

        ctx.strokeStyle = color;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
    });

    // Draw nodes (intersections)
    nodes.forEach(node => {
        if (node.type === "normal"){
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = "green";
            ctx.beginPath();
            ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

setInterval(updateTraffic, 100);
drawGraph();
animate();


//car and traffic stuff ----------------------------
class Car {
    constructor(startNode, targetNode) {
        this.currentNode = startNode;
        this.targetNode = targetNode;
        this.path = findShortestPath(startNode, targetNode); // Implement this next
    }

    move() {
        if (this.path.length > 1) {
            this.currentNode = this.path.shift(); // Move to next node
        } else {
            // Remove car when it reaches the destination
            cars = cars.filter(car => car !== this);
        }
    }
}

function findShortestPath(startId, targetId) {
    let distances = {};
    let prev = {};
    let queue = new Set(nodes.map(node => node.id));

    nodes.forEach(node => distances[node.id] = Infinity);
    distances[startId] = 0;

    while (queue.size > 0) {
        let minNode = [...queue].reduce((a, b) => distances[a] < distances[b] ? a : b);
        queue.delete(minNode);

        if (minNode === targetId) break;

        edges.filter(edge => edge.startNode === minNode || edge.endNode === minNode)
             .forEach(edge => {
                let neighbor = edge.startNode === minNode ? edge.endNode : edge.startNode;
                if (!queue.has(neighbor)) return;

                let newDist = distances[minNode] + 1; // Treat all roads as equal length
                if (newDist < distances[neighbor]) {
                    distances[neighbor] = newDist;
                    prev[neighbor] = minNode;
                }
            });
    }

    // Reconstruct path
    let path = [];
    let step = targetId;
    while (step !== undefined) {
        path.unshift(step);
        step = prev[step];
    }
    return path;
}

let cars = []; // list of all cars
// Spawn a car from a random node to another random node
function spawnCar() {
    let startNode = nodes[Math.floor(Math.random() * nodes.length)];
    let targetNode;
    do {
        targetNode = nodes[Math.floor(Math.random() * nodes.length)];
    } while (targetNode.id === startNode.id);

    cars.push(new Car(startNode.id, targetNode.id));
}

// Move all cars once per update cycle
function updateTraffic() {
    cars.forEach(car => car.move());

    // Recalculate traffic
    edges.forEach(edge => edge.traffic = 0);
    cars.forEach(car => {
        let road = edges.find(edge => 
            (edge.startNode === car.currentNode && edge.endNode === car.path[0]) ||
            (edge.endNode === car.currentNode && edge.startNode === car.path[0])
        );
        if (road) road.traffic += 1;
    });

    drawGraph();
}

//spawn a car at all source nodes
function spawnCarsFromSources() {
    if (!(edges.length === 0)) {
        nodes.filter(node => node.type === "source").forEach(source => {
            let targetNode;
            do {
                targetNode = nodes[Math.floor(Math.random() * nodes.length)];
            } while (targetNode.id === source.id);

            cars.push(new Car(source.id, targetNode.id));
        });
    }
}

// Run this function every 3 seconds
setInterval(spawnCarsFromSources, 10);