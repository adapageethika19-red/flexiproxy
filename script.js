// ============================================================
// FLEXIPROXY FRONTEND
// Clean version - no template literals
// ============================================================

const API = "http://localhost:8080";

const STATUS_API = API + "/api/status";
const METRICS_API = API + "/api/metrics";
const LOGS_API = API + "/api/logs";
const WARNINGS_API = API + "/api/warnings";
const TRENDS_API = API + "/api/trends";
const PROXY_API = API + "/proxy";

let liveTraffic = false;
let trafficTimer = null;
let chart = null;


// ============================================================
// BASIC HELPERS
// ============================================================

function getElement(id) {
    return document.getElementById(id);
}


function setText(id, value) {
    const element = getElement(id);

    if (element) {
        element.textContent = value;
    }
}


function formatNumber(value) {
    if (value === undefined || value === null) {
        return "0";
    }

    return Number(value).toLocaleString();
}


// ============================================================
// CLOCK
// ============================================================

function updateClock() {

    const clock = getElement("systemClock");

    if (!clock) {
        return;
    }

    const now = new Date();

    clock.textContent = now.toLocaleString();
}


setInterval(updateClock, 1000);
updateClock();


// ============================================================
// PAGE NAVIGATION
// ============================================================

function showPage(page) {

    document.querySelectorAll(".page").forEach(function(element) {

        element.classList.remove("active");

    });


    const selectedPage = getElement(page);

    if (selectedPage) {
        selectedPage.classList.add("active");
    }


    document.querySelectorAll(".nav-item").forEach(function(item) {

        item.classList.remove("active");

    });


    document.querySelectorAll(".nav-item").forEach(function(item) {

        if (item.getAttribute("data-page") === page) {
            item.classList.add("active");
        }

    });
}


document.querySelectorAll(".nav-item").forEach(function(item) {

    item.addEventListener("click", function() {

        const page = item.getAttribute("data-page");

        if (page) {
            showPage(page);
        }

    });

});


// ============================================================
// CONNECTION STATUS
// ============================================================

function setConnectionStatus(connected) {

    const statusElement = getElement("connectionStatus");

    if (!statusElement) {
        return;
    }

    if (connected) {

        statusElement.textContent = "● Connected";

        statusElement.classList.remove("offline");
        statusElement.classList.add("online");

    } else {

        statusElement.textContent = "● Backend Connecting";

        statusElement.classList.remove("online");
        statusElement.classList.add("offline");

    }
}


// ============================================================
// FETCH STATUS
// ============================================================

async function updateStatus() {

    try {

        const response = await fetch(STATUS_API);

        if (!response.ok) {
            throw new Error("Status request failed");
        }

        const data = await response.json();

        setConnectionStatus(true);

        updateDashboard(data);

    } catch (error) {

        console.error("Status API error:", error);

        setConnectionStatus(false);

    }
}


// ============================================================
// UPDATE DASHBOARD
// ============================================================

function updateDashboard(data) {

    if (!data) {
        return;
    }


    // --------------------------------------------------------
    // SERVER COUNTS
    // --------------------------------------------------------

    if (data.servers) {

        setText(
            "totalServers",
            data.servers.total
        );

        setText(
            "healthyServers",
            data.servers.healthy
        );

        setText(
            "warningServers",
            data.servers.warning
        );

        setText(
            "offlineServers",
            data.servers.offline
        );
    }


    // --------------------------------------------------------
    // SYSTEM
    // --------------------------------------------------------

    if (data.system) {

        setText(
            "systemCPU",
            data.system.cpu + "%"
        );

        setText(
            "systemMemory",
            data.system.memory + "%"
        );
    }


    // --------------------------------------------------------
    // REQUESTS
    // --------------------------------------------------------

    setText(
        "totalRequests",
        formatNumber(data.total_requests)
    );


    setText(
        "successfulRequests",
        formatNumber(data.successful_requests)
    );


    setText(
        "failedRequests",
        formatNumber(data.failed_requests)
    );


    // --------------------------------------------------------
    // SERVER TABLE
    // --------------------------------------------------------

    updateServerTable(data.server_list);

    // --------------------------------------------------------
    // SERVER CARDS
    // --------------------------------------------------------

    updateServerCards(data.server_list);
}


// ============================================================
// SERVER TABLE
// ============================================================

function updateServerTable(servers) {

    const tableBody = getElement("serverTableBody");

    if (!tableBody || !servers) {
        return;
    }

    tableBody.innerHTML = "";


    servers.forEach(function(server) {

        const row = document.createElement("tr");

        const statusClass =
            String(server.status).toLowerCase();


        row.innerHTML =
            "<td>" +
                server.name +
            "</td>" +

            "<td>" +
                server.port +
            "</td>" +

            "<td>" +
                "<span class='status " +
                statusClass +
                "'>" +
                server.status +
                "</span>" +
            "</td>" +

            "<td>" +
                server.response_time +
                " ms" +
            "</td>" +

            "<td>" +
                server.cpu +
                "%" +
            "</td>" +

            "<td>" +
                server.memory +
                "%" +
            "</td>" +

            "<td>" +
                server.score +
            "</td>" +

            "<td>" +
                server.trend +
            "</td>";


        tableBody.appendChild(row);

    });
}


// ============================================================
// SERVER CARDS
// ============================================================

function updateServerCards(servers) {

    const container = getElement("serverCards");

    if (!container || !servers) {
        return;
    }

    container.innerHTML = "";


    servers.forEach(function(server) {

        const card = document.createElement("div");

        card.className = "server-card";


        card.innerHTML =

            "<div class='server-card-header'>" +

                "<div>" +
                    "<h3>" +
                        server.name +
                    "</h3>" +

                    "<p>" +
                        "Port " +
                        server.port +
                    "</p>" +
                "</div>" +

                "<span class='status " +
                    String(server.status).toLowerCase() +
                "'>" +
                    server.status +
                "</span>" +

            "</div>" +


            "<div class='server-card-stats'>" +

                "<div>" +
                    "<span>Response</span>" +
                    "<strong>" +
                        server.response_time +
                        " ms" +
                    "</strong>" +
                "</div>" +

                "<div>" +
                    "<span>CPU</span>" +
                    "<strong>" +
                        server.cpu +
                        "%" +
                    "</strong>" +
                "</div>" +

                "<div>" +
                    "<span>Memory</span>" +
                    "<strong>" +
                        server.memory +
                        "%" +
                    "</strong>" +
                "</div>" +

                "<div>" +
                    "<span>Score</span>" +
                    "<strong>" +
                        server.score +
                    "</strong>" +
                "</div>" +

            "</div>";


        container.appendChild(card);

    });
}


// ============================================================
// METRICS
// ============================================================

async function updateMetrics() {

    try {

        const response = await fetch(METRICS_API);

        if (!response.ok) {
            throw new Error("Metrics request failed");
        }

        const data = await response.json();


        setText(
            "requestsPerSec",
            data.requests_per_sec
        );


        setText(
            "activeRequests",
            data.active_requests
        );


        setText(
            "successRate",
            data.success_rate + "%"
        );


        setText(
            "averageResponse",
            data.average_response_time + " ms"
        );


        setText(
            "totalRequests",
            formatNumber(data.total_requests)
        );


        setText(
            "successfulRequests",
            formatNumber(data.successful_requests)
        );


        setText(
            "failedRequests",
            formatNumber(data.failed_requests)
        );


        if (data.servers) {
            updateServerCards(data.servers);
        }


        updateChart(data.servers);

    } catch (error) {

        console.error("Metrics API error:", error);

    }
}


// ============================================================
// LOGS
// ============================================================

async function updateLogs() {

    try {

        const response = await fetch(LOGS_API);

        if (!response.ok) {
            throw new Error("Logs request failed");
        }

        const data = await response.json();

        const logsContainer = getElement("logsContainer");

        if (!logsContainer || !data.logs) {
            return;
        }

        logsContainer.innerHTML = "";


        data.logs.forEach(function(log) {

            const item = document.createElement("div");

            item.className = "log-item";


            item.innerHTML =

                "<span class='log-time'>" +
                    log.time +
                "</span>" +

                "<span class='log-level " +
                    String(log.level).toLowerCase() +
                "'>" +
                    log.level +
                "</span>" +

                "<span class='log-message'>" +
                    log.message +
                "</span>";


            logsContainer.appendChild(item);

        });

    } catch (error) {

        console.error("Logs API error:", error);

    }
}


// ============================================================
// WARNINGS
// ============================================================

async function updateWarnings() {

    try {

        const response = await fetch(WARNINGS_API);

        if (!response.ok) {
            throw new Error("Warnings request failed");
        }

        const data = await response.json();

        const container = getElement("warningsContainer");

        if (!container) {
            return;
        }

        container.innerHTML = "";


        if (!data.warnings || data.warnings.length === 0) {

            container.innerHTML =
                "<div class='no-warning'>" +
                "✓ No active warnings" +
                "</div>";

            return;
        }


        data.warnings.forEach(function(warning) {

            const item = document.createElement("div");

            item.className = "warning-item";


            item.innerHTML =

                "<strong>" +
                    warning.server +
                "</strong>" +

                "<span>" +
                    warning.message +
                "</span>";


            container.appendChild(item);

        });

    } catch (error) {

        console.error("Warnings API error:", error);

    }
}


// ============================================================
// CHART
// ============================================================

function updateChart(servers) {

    const canvas = getElement("performanceChart");

    if (!canvas || !servers) {
        return;
    }


    if (typeof Chart === "undefined") {
        return;
    }


    const labels = [];
    const scores = [];


    servers.forEach(function(server) {

        labels.push(server.name);
        scores.push(server.score);

    });


    if (chart) {

        chart.data.labels = labels;

        chart.data.datasets[0].data = scores;

        chart.update();

        return;
    }


    chart = new Chart(
        canvas,
        {
            type: "bar",

            data: {

                labels: labels,

                datasets: [
                    {
                        label: "Server Score",
                        data: scores
                    }
                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                scales: {

                    y: {
                        beginAtZero: true,
                        max: 100
                    }

                }

            }

        }
    );
}


// ============================================================
// TEST REQUEST
// ============================================================

async function sendTestRequest() {

    try {

        const response = await fetch(PROXY_API);

        const data = await response.json();

        console.log("Test request:", data);

        updateStatus();
        updateMetrics();
        updateLogs();

        alert(
            "Request routed to " +
            data.routed_to
        );

    } catch (error) {

        console.error(
            "Test request failed:",
            error
        );

        alert(
            "FlexiProxy backend is not connected."
        );
    }
}


// ============================================================
// LIVE TRAFFIC
// ============================================================

async function generateTraffic() {

    try {

        const response = await fetch(PROXY_API);

        const data = await response.json();

        console.log(
            "Live traffic request:",
            data
        );

        updateStatus();
        updateMetrics();
        updateLogs();

    } catch (error) {

        console.error(
            "Live traffic error:",
            error
        );

    }
}


function toggleLiveTraffic() {

    const button = getElement("liveTrafficButton");

    liveTraffic = !liveTraffic;


    if (liveTraffic) {

        if (button) {
            button.textContent = "Stop Live Traffic";
        }

        generateTraffic();

        trafficTimer = setInterval(
            generateTraffic,
            1000
        );

    } else {

        if (button) {
            button.textContent = "Start Live Traffic";
        }

        clearInterval(trafficTimer);

        trafficTimer = null;
    }
}


// ============================================================
// BUTTONS
// ============================================================

const testButton = getElement(
    "testRequestButton"
);

if (testButton) {

    testButton.addEventListener(
        "click",
        sendTestRequest
    );

}


const liveButton = getElement(
    "liveTrafficButton"
);

if (liveButton) {

    liveButton.addEventListener(
        "click",
        toggleLiveTraffic
    );

}


// ============================================================
// INITIAL LOAD
// ============================================================

async function initializeDashboard() {

    console.log(
        "FlexiProxy dashboard starting..."
    );


    await updateStatus();

    await updateMetrics();

    await updateLogs();

    await updateWarnings();


    console.log(
        "FlexiProxy dashboard initialized."
    );
}


initializeDashboard();


// ============================================================
// AUTO REFRESH
// ============================================================

setInterval(
    updateStatus,
    3000
);

setInterval(
    updateMetrics,
    3000
);

setInterval(
    updateLogs,
    3000
);

setInterval(
    updateWarnings,
    5000
);
