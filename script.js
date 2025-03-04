const canvas = document.getElementById("trafficCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let roads = [
    { x1: 100, y1: 100, x2: 400, y2: 100, traffic: 0.3 },
    { x1: 400, y1: 100, x2: 700, y2: 300, traffic: 0.7 }
];

function drawRoads() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    roads.forEach(road => {
        let color = `rgb(${road.traffic * 255}, ${255 - road.traffic * 255}, 0)`;
        ctx.strokeStyle = color;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(road.x1, road.y1);
        ctx.lineTo(road.x2, road.y2);
        ctx.stroke();
    });
}

function updateTraffic() {
    roads.forEach(road => {
        road.traffic = 0.1; // Simulating random traffic
    });
    drawRoads();
}

function addRoad() {
    if (roads.length === 0) return;

    let baseRoad = roads[Math.floor(Math.random() * roads.length)];
    let attachPoint = Math.random() < 0.5 ? { x: baseRoad.x1, y: baseRoad.y1 }
                                          : { x: baseRoad.x2, y: baseRoad.y2 };

    let newEnd;
    let tries = 0;  // Prevent infinite loops

    do {
        if (Math.random() < 0.5 && roads.length > 1) {
            let targetRoad;
            do {
                targetRoad = roads[Math.floor(Math.random() * roads.length)];
            } while (targetRoad === baseRoad); // Avoid self-connection

            newEnd = Math.random() < 0.5 ? { x: targetRoad.x1, y: targetRoad.y1 }
                                         : { x: targetRoad.x2, y: targetRoad.y2 };
        } else {
            newEnd = { x: Math.random() * canvas.width, y: Math.random() * canvas.height };
        }

        tries++;
    } while (
        (newEnd.x === attachPoint.x && newEnd.y === attachPoint.y) && tries < 10
    ); // Retry if it picks the same point

    if (tries >= 10) return; // Failsafe to avoid infinite loops

    roads.push({
        x1: attachPoint.x, y1: attachPoint.y,
        x2: newEnd.x, y2: newEnd.y,
        traffic: Math.random()
    });

    drawRoads();
}



setInterval(updateTraffic, 1000);
drawRoads();
