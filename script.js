/* =========================================================
FLEXIPROXY FRONTEND - COMPLETE SCRIPT
Early-Warning Health Monitoring Enabled
========================================================= */

const API = "http://localhost:8080";

const STATUS_API = API + "/api/status";
const METRICS_API = API + "/api/metrics";
const LOGS_API = API + "/api/logs";
const PROXY_API = API + "/proxy";

let trafficRunning = false;
let trafficInterval = null;
let chart = null;

/* =========================================================
PAGE NAVIGATION
========================================================= */

const pages = {
dashboard: {
title: "Dashboard",
subtitle: "Real-time reverse proxy monitoring"
},

```
servers: {
    title: "Servers",
    subtitle: "Backend server health and performance"
},

analytics: {
    title: "Analytics",
    subtitle: "Traffic and performance analytics"
},

logs: {
    title: "Logs",
    subtitle: "Recent proxy activity"
},

settings: {
    title: "Settings",
    subtitle: "FlexiProxy system configuration"
}
```

};

document.querySelectorAll(".nav-item").forEach(function(button) {

```
button.addEventListener("click", function() {

    const page = button.dataset.page;

    showPage(page);

});
```

});

function showPage(page) {

```
document.querySelectorAll(".nav-item").forEach(function(item) {
    item.classList.remove("active");
});


const activeButton =
    document.querySelector('[data-page="' + page + '"]');

if (activeButton) {
    activeButton.classList.add("active");
}


document.querySelectorAll(".page").forEach(function(section) {
    section.classList.add("hidden-page");
});


const selectedPage =
    document.getElementById(page + "Page");

if (selectedPage) {
    selectedPage.classList.remove("hidden-page");
}


if (pages[page]) {

    document.getElementById("pageTitle").textContent =
        pages[page].title;

    document.getElementById("pageSubtitle").textContent =
        pages[page].subtitle;

}
```

}

/* =========================================================
CLOCK
========================================================= */

function updateClock() {

```
const now = new Date();


const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
});


const date = now.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric"
});


const clock = document.getElementById("currentTime");

if (clock) {
    clock.textContent = date + " " + time;
}
```

}

/* =========================================================
CONNECTION STATUS
========================================================= */

function setConnection(connected) {

```
const badge = document.getElementById("connectionStatus");

if (!badge) {
    return;
}


if (connected) {

    badge.textContent = "Backend Connected";

    badge.classList.remove("offline");

    badge.classList.add("online");

} else {

    badge.textContent = "Backend Connecting...";

    badge.classList.remove("online");

    badge.classList.add("offline");

}
```

}

/* =========================================================
STATUS UPDATE
========================================================= */

async function updateStatus() {

```
try {

    const response = await fetch(STATUS_API);

    if (!response.ok) {
        throw new Error("Status API error");
    }

    const data = await response.json();


    setConnection(true);


    updateSystemHealth(data);

    updateServers(data.servers || []);

} catch (error) {

    console.error("Backend connection error:", error);

    setConnection(false);

}
```

}

/* =========================================================
SYSTEM HEALTH
========================================================= */

function updateSystemHealth(data) {

```
const status = data.status || "Unknown";

const statusElement =
    document.getElementById("systemStatus");

if (statusElement) {
    statusElement.textContent = status;
}


const cpu = Number(data.cpu || 0);

const cpuElement =
    document.getElementById("cpuUsage");

if (cpuElement) {
    cpuElement.textContent = cpu.toFixed(1) + "%";
}


const servers = data.servers || [];

const healthy =
    servers.filter(function(server) {
        return server.status === "Healthy";
    }).length;

const warning =
    servers.filter(function(server) {
        return server.status === "Warning";
    }).length;

const critical =
    servers.filter(function(server) {
        return server.status === "Critical";
    }).length;


const healthyElement =
    document.getElementById("healthyServers");

if (healthyElement) {
    healthyElement.textContent = healthy;
}


const warningElement =
    document.getElementById("warningServers");

if (warningElement) {
    warningElement.textContent = warning;
}


const criticalElement =
    document.getElementById("criticalServers");

if (criticalElement) {
    criticalElement.textContent = critical;
}


const earlyWarning =
    document.getElementById("earlyWarningStatus");

if (earlyWarning) {

    if (warning > 0) {

        earlyWarning.textContent =
            warning + " Warning";

    } else {

        earlyWarning.textContent =
            "Monitoring Active";

    }

}
```

}

/* =========================================================
SERVER UPDATE
========================================================= */

function updateServers(servers) {

```
updateServerTable(servers);

updateServerCards(servers);

updateDashboardServers(servers);


const online =
    servers.filter(function(server) {
        return server.status !== "Offline";
    }).length;


const serversOnline =
    document.getElementById("serversOnline");

if (serversOnline) {
    serversOnline.textContent = online;
}
```

}

/* =========================================================
STATUS CLASS
========================================================= */

function getStatusClass(status) {

```
if (status === "Healthy") {
    return "healthy";
}

if (status === "Warning") {
    return "warning";
}

if (status === "Critical") {
    return "critical";
}

if (status === "Offline") {
    return "offline";
}

return "unknown";
```

}

/* =========================================================
STATUS ICON
========================================================= */

function getStatusIcon(status) {

```
if (status === "Healthy") {
    return "●";
}

if (status === "Warning") {
    return "⚠";
}

if (status === "Critical") {
    return "✕";
}

if (status === "Offline") {
    return "○";
}

return "?";
```

}

/* =========================================================
DASHBOARD SERVER MINI LIST
========================================================= */

function updateDashboardServers(servers) {

```
const container =
    document.getElementById("dashboardServerList");

if (!container) {
    return;
}


container.innerHTML = "";


servers.forEach(function(server) {

    const item = document.createElement("div");

    item.className =
        "dashboard-server-item " +
        getStatusClass(server.status);


    item.innerHTML =
        "<div>" +
            "<strong>" + server.name + "</strong>" +
            "<span>Port " + server.port + "</span>" +
        "</div>" +

        "<div>" +
            "<strong>" + getStatusIcon(server.status) + "</strong>" +
            "<span>" + server.status + "</span>" +
        "</div>";


    container.appendChild(item);

});
```

}

/* =========================================================
SERVER TABLE
========================================================= */

function updateServerTable(servers) {

```
const tableBody =
    document.getElementById("serverTableBody");

if (!tableBody) {
    return;
}


tableBody.innerHTML = "";


servers.forEach(function(server) {

    const row = document.createElement("tr");


    const score = Number(
        server.score === undefined ? -1 : server.score
    );


    const trend = server.trend || {};


    const statusClass =
        getStatusClass(server.status);


    row.innerHTML =
        "<td>" +
            "<strong>" + server.name + "</strong>" +
        "</td>" +

        "<td>" +
            server.port +
        "</td>" +

        "<td>" +
            "<span class='status-badge " +
            statusClass +
            "'>" +
            getStatusIcon(server.status) +
            " " +
            server.status +
            "</span>" +
        "</td>" +

        "<td>" +
            Number(server.response_time || 0) +
            " ms" +
        "</td>" +

        "<td>" +
            Number(server.cpu || 0).toFixed(1) +
            "%" +
        "</td>" +

        "<td>" +
            Number(server.ram || 0).toFixed(1) +
            "%" +
        "</td>" +

        "<td>" +
            "<strong>" +
            (score >= 0 ? score.toFixed(2) : "N/A") +
            "</strong>" +
        "</td>" +

        "<td>" +
            "<div>CPU: " +
            getTrendDisplay(trend.cpu) +
            "</div>" +

            "<div>RAM: " +
            getTrendDisplay(trend.ram) +
            "</div>" +

            "<div>Response: " +
            getTrendDisplay(trend.response_time) +
            "</div>" +

        "</td>";


    tableBody.appendChild(row);

});
```

}

/* =========================================================
SERVER CARDS
========================================================= */

function updateServerCards(servers) {

```
const container =
    document.getElementById("serverCards");

if (!container) {
    return;
}


container.innerHTML = "";


servers.forEach(function(server) {

    const card = document.createElement("div");

    card.className =
        "server-card " +
        getStatusClass(server.status);


    const warningMessages =
        server.warning_messages || [];


    let warningHTML = "";


    if (warningMessages.length > 0) {

        warningHTML =
            "<div class='server-warning'>" +

                "<strong>⚠ Early Warning</strong>" +

                "<ul>";

        warningMessages.forEach(function(message) {

            warningHTML +=
                "<li>" +
                message +
                "</li>";

        });

        warningHTML +=
                "</ul>" +
            "</div>";

    }


    const trend = server.trend || {};


    card.innerHTML =

        "<div class='server-card-header'>" +

            "<div>" +

                "<h3>" +
                server.name +
                "</h3>" +

                "<p>Port " +
                server.port +
                "</p>" +

            "</div>" +

            "<span class='status-badge " +
            getStatusClass(server.status) +
            "'>" +

                getStatusIcon(server.status) +
                " " +
                server.status +

            "</span>" +

        "</div>" +


        warningHTML +


        "<div class='server-score'>" +

            "<span>Smart Score</span>" +

            "<strong>" +

                (
                    Number(server.score) >= 0
                    ? Number(server.score).toFixed(2)
                    : "N/A"
                ) +

            "</strong>" +

        "</div>" +


        "<div class='server-metrics'>" +

            "<div>" +
                "<span>Response</span>" +
                "<strong>" +
                Number(server.response_time || 0) +
                " ms</strong>" +
            "</div>" +

            "<div>" +
                "<span>CPU</span>" +
                "<strong>" +
                Number(server.cpu || 0).toFixed(1) +
                "%</strong>" +
            "</div>" +

            "<div>" +
                "<span>Memory</span>" +
                "<strong>" +
                Number(server.ram || 0).toFixed(1) +
                "%</strong>" +
            "</div>" +

        "</div>" +


        "<div class='server-trends'>" +

            "<div>" +
                "<span>CPU Trend</span>" +
                getTrendDisplay(trend.cpu) +
            "</div>" +

            "<div>" +
                "<span>RAM Trend</span>" +
                getTrendDisplay(trend.ram) +
            "</div>" +

            "<div>" +
                "<span>Response Trend</span>" +
                getTrendDisplay(trend.response_time) +
            "</div>" +

        "</div>";


    container.appendChild(card);

});
```

}

/* =========================================================
TREND DISPLAY
========================================================= */

function getTrendDisplay(trend) {

```
if (trend === "Rising") {

    return "<span class='trend rising'>↑ Rising</span>";

}

if (trend === "Falling") {

    return "<span class='trend falling'>↓ Falling</span>";

}

return "<span class='trend stable'>→ Stable</span>";
```

}

/* =========================================================
METRICS
========================================================= */

async function updateMetrics() {

```
try {

    const response =
        await fetch(METRICS_API);

    if (!response.ok) {
        throw new Error("Metrics API error");
    }

    const data =
        await response.json();


    const requests =
        Number(data.requests_per_second || 0);


    const active =
        Number(data.active_requests || 0);


    const success =
        Number(data.success_rate || 0);


    const requestElement =
        document.getElementById("requestsPerSec");

    if (requestElement) {
        requestElement.textContent =
            requests.toFixed(0);
    }


    const activeElement =
        document.getElementById("activeRequests");

    if (activeElement) {
        activeElement.textContent =
            active;
    }


    const successElement =
        document.getElementById("successRate");

    if (successElement) {

        successElement.textContent =
            success.toFixed(1) + "%";

    }


    updateChart(data);

} catch (error) {

    console.error(
        "Metrics update error:",
        error
    );

}
```

}

/* =========================================================
CHART
========================================================= */

function updateChart(data) {

```
const canvas =
    document.getElementById("trafficChart");

if (!canvas) {
    return;
}


if (typeof Chart === "undefined") {

    console.warn(
        "Chart.js is not loaded."
    );

    return;

}


const labels =
    data.labels || [];


const values =
    data.values || [];


if (chart) {

    chart.data.labels = labels;

    chart.data.datasets[0].data =
        values;

    chart.update();

    return;

}


chart = new Chart(canvas, {

    type: "line",

    data: {

        labels: labels,

        datasets: [

            {

                label: "Requests/sec",

                data: values,

                tension: 0.3,

                fill: true

            }

        ]

    },

    options: {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

            legend: {
                display: true
            }

        },

        scales: {

            y: {
                beginAtZero: true
            }

        }

    }

});
```

}

/* =========================================================
LOGS
========================================================= */

async function updateLogs() {

```
try {

    const response =
        await fetch(LOGS_API);

    if (!response.ok) {
        throw new Error("Logs API error");
    }

    const data =
        await response.json();


    const logs =
        data.logs || [];


    const container =
        document.getElementById("logsContainer");

    if (!container) {
        return;
    }


    container.innerHTML = "";


    logs.slice().reverse().forEach(function(log) {

        const item =
            document.createElement("div");

        item.className = "log-item";


        const time =
            log.timestamp || log.time || "";


        const server =
            log.server || "Unknown";


        const status =
            log.status || "Success";


        const responseTime =
            log.response_time === undefined
            ? ""
            : log.response_time + " ms";


        item.innerHTML =

            "<div>" +

                "<strong>" +
                server +
                "</strong>" +

                "<span>" +
                status +
                "</span>" +

            "</div>" +

            "<div>" +

                "<small>" +
                time +
                "</small>" +

                "<small>" +
                responseTime +
                "</small>" +

            "</div>";


        container.appendChild(item);

    });


} catch (error) {

    console.error(
        "Logs update error:",
        error
    );

}
```

}

/* =========================================================
TEST REQUEST
========================================================= */

async function sendTestRequest() {

```
try {

    const response =
        await fetch(PROXY_API);


    const data =
        await response.json();


    console.log(
        "Test request response:",
        data
    );


    await updateStatus();

    await updateMetrics();

    await updateLogs();


    alert(
        "Request successfully processed by " +
        (data.routed_to || "backend server")
    );


} catch (error) {

    console.error(
        "Test request failed:",
        error
    );


    alert(
        "Test request failed. " +
        "Make sure FlexiProxy backend is running."
    );

}
```

}

/* =========================================================
LIVE TRAFFIC
========================================================= */

function startLiveTraffic() {

```
if (trafficRunning) {
    return;
}


trafficRunning = true;


const button =
    document.getElementById("liveTrafficButton");

if (button) {

    button.textContent =
        "Stop Live Traffic";

}


trafficInterval =
    setInterval(async function() {

        try {

            await fetch(PROXY_API);

            await updateStatus();

            await updateMetrics();

            await updateLogs();

        } catch (error) {

            console.error(
                "Live traffic error:",
                error
            );

        }

    }, 1000);
```

}

/* =========================================================
STOP LIVE TRAFFIC
========================================================= */

function stopLiveTraffic() {

```
trafficRunning = false;


if (trafficInterval) {

    clearInterval(trafficInterval);

    trafficInterval = null;

}


const button =
    document.getElementById("liveTrafficButton");

if (button) {

    button.textContent =
        "Start Live Traffic";

}
```

}

/* =========================================================
TOGGLE LIVE TRAFFIC
========================================================= */

function toggleLiveTraffic() {

```
if (trafficRunning) {

    stopLiveTraffic();

} else {

    startLiveTraffic();

}
```

}

/* =========================================================
INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", function() {

```
updateClock();

setInterval(updateClock, 1000);


updateStatus();

updateMetrics();

updateLogs();


setInterval(updateStatus, 3000);

setInterval(updateMetrics, 3000);

setInterval(updateLogs, 5000);


const testButton =
    document.getElementById("testRequestButton");

if (testButton) {

    testButton.addEventListener(
        "click",
        sendTestRequest
    );

}


const liveButton =
    document.getElementById("liveTrafficButton");

if (liveButton) {

    liveButton.addEventListener(
        "click",
        toggleLiveTraffic
    );

}
```

});
