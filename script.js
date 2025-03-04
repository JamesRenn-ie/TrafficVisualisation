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

//adding random roads
function addNode(x, y) {
    const id = nodes.length;
    nodes.push({ id, x, y });
    return id;
}

function addEdge(startNode, endNode) {
    if (startNode === endNode) return; // Prevent loops
    edges.push({ startNode, endNode, traffic: Math.random() });
}

// Create initial node
addNode(canvas.width / 2, canvas.height / 2);

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
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
}

function updateTraffic() {
    edges.forEach(edge => {
        edge.traffic = Math.random(); // Simulate traffic changes
    });
    drawGraph();
}

setInterval(updateTraffic, 1000);
drawGraph();
