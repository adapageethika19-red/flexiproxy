```javascript
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
};


document.querySelectorAll(".nav-item").forEach(button => {

    button.addEventListener("click", () => {

        const page = button.dataset.page;

        showPage(page);

    });

});


function showPage(page) {

    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
    });


    const activeButton =
        document.querySelector(`[data-page="${page}"]`);

    if (activeButton) {
        activeButton.classList.add("active");
    }


    document.querySelectorAll(".page").forEach(section => {
        section.classList.add("hidden-page");
    });


    const selectedPage =
        document.getElementById(`${page}Page`);

    if (selectedPage) {
        selectedPage.classList.remove("hidden-page");
    }


    if (pages[page]) {

        document.getElementById("pageTitle").textContent =
            pages[page].title;

        document.getElementById("pageSubtitle").textContent =
            pages[page].subtitle;

    }

}


/* =========================================================
   CLOCK
========================================================= */

function updateClock() {

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


    document.getElementById("currentTime").textContent =
        `${date} ${time}`;


    document.getElementById("sidebarTime").textContent =
        `${date} ${time}`;

}


setInterval(updateClock, 1000);

updateClock();


/* =========================================================
   CONNECTION STATUS
========================================================= */

function setConnection(connected) {

    const text =
        document.getElementById("connectionText");

    const dot =
        document.querySelector(".connection-dot");


    if (connected) {

        text.textContent = "Connected";

        dot.style.background = "#35d39a";

        dot.style.boxShadow =
            "0 0 10px rgba(53,211,154,.6)";

    }

    else {

        text.textContent = "Disconnected";

        dot.style.background = "#ff5f6d";

        dot.style.boxShadow =
            "0 0 10px rgba(255,95,109,.6)";

    }

}


/* =========================================================
   STATUS
========================================================= */

async function updateStatus() {

    try {

        const response =
            await fetch(STATUS_API);


        if (!response.ok) {
            throw new Error("Status request failed");
        }


        const data =
            await response.json();


        setConnection(true);


        updateSystemHealth(data);


        updateServers(data.servers || []);

    }


    catch (error) {

        console.error("Status error:", error);


        setConnection(false);


        const health =
            document.getElementById("overallHealth");


        health.textContent = "Offline";

        health.style.color = "#ff5f6d";

    }

}


/* =========================================================
   SYSTEM HEALTH
========================================================= */

function updateSystemHealth(data) {

    const cpu =
        Number(data.cpu || 0);


    const ram =
        Number(data.ram || 0);


    const servers =
        data.servers || [];


    const healthyCount =
        servers.filter(server =>
            server.status === "Healthy"
        ).length;


    const warningCount =
        servers.filter(server =>
            server.status === "Warning"
        ).length;


    const criticalCount =
        servers.filter(server =>
            server.status === "Critical"
        ).length;


    document.getElementById("cpuValue")
        .textContent = `${cpu.toFixed(1)}%`;


    document.getElementById("ramValue")
        .textContent = `${ram.toFixed(1)}%`;


    document.getElementById("cpuBar")
        .style.width =
        `${Math.min(cpu, 100)}%`;


    document.getElementById("ramBar")
        .style.width =
        `${Math.min(ram, 100)}%`;


    /*
       Healthy + Warning servers can
       still receive traffic.
    */

    const usableServers =
        healthyCount + warningCount;


    document.getElementById("serverHealthCount")
        .textContent = usableServers;


    /*
       Overall system status
    */

    const health =
        document.getElementById("overallHealth");


    if (criticalCount > 0) {

        health.textContent = "Critical";

        health.style.color = "#ff5f6d";

    }

    else if (warningCount > 0) {

        health.textContent = "Warning";

        health.style.color = "#ffad5c";

    }

    else if (healthyCount > 0) {

        health.textContent = "Healthy";

        health.style.color = "#35d39a";

    }

    else {

        health.textContent = "Offline";

        health.style.color = "#ff5f6d";

    }

}


/* =========================================================
   SERVERS
========================================================= */

function updateServers(servers) {

    updateServerTable(servers);

    updateServerCards(servers);

    updateDashboardServers(servers);


    const online =
        servers.filter(server =>
            server.status !== "Offline"
        ).length;


    document.getElementById("serversOnline")
        .textContent = online;

}


/* =========================================================
   STATUS COLOR
========================================================= */

function getStatusClass(status) {

    if (status === "Healthy") {
        return "status-healthy";
    }


    if (status === "Warning") {
        return "status-warning";
    }


    if (status === "Critical") {
        return "status-critical";
    }


    return "status-offline";

}


/* =========================================================
   STATUS ICON
========================================================= */

function getStatusIcon(status) {

    if (status === "Healthy") {
        return "🟢";
    }


    if (status === "Warning") {
        return "🟡";
    }


    if (status === "Critical") {
        return "🔴";
    }


    return "⚫";

}


/* =========================================================
   DASHBOARD SERVER MINI LIST
========================================================= */

function updateDashboardServers(servers) {

    const container =
        document.getElementById("dashboardServers");


    container.innerHTML = "";


    servers.forEach((server, index) => {

        const item =
            document.createElement("div");


        item.className = "mini-server";


        const icon =
            getStatusIcon(server.status);


        item.innerHTML =
            `${icon} S${index + 1}`;


        if (server.status === "Offline") {

            item.style.color = "#ff5f6d";

            item.style.background =
                "rgba(255,95,109,.1)";

        }

        else if (server.status === "Critical") {

            item.style.color = "#ff5f6d";

            item.style.background =
                "rgba(255,95,109,.1)";

        }

        else if (server.status === "Warning") {

            item.style.color = "#ffad5c";

            item.style.background =
                "rgba(255,173,92,.1)";

        }

        else {

            item.style.color = "#35d39a";

            item.style.background =
                "rgba(53,211,154,.1)";

        }


        container.appendChild(item);

    });

}


/* =========================================================
   SERVER TABLE
========================================================= */

function updateServerTable(servers) {

    const tbody =
        document.getElementById("serverTableBody");


    tbody.innerHTML = "";


    if (servers.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="8"
                    style="text-align:center;color:#8d99aa;">
                    No servers found
                </td>
            </tr>
        `;

        return;

    }


    servers.forEach(server => {

        const row =
            document.createElement("tr");


        const statusClass =
            getStatusClass(server.status);


        const statusIcon =
            getStatusIcon(server.status);


        const score =
            Number(server.score ?? -1);


        const trend =
            server.trend || {};


        row.innerHTML = `

            <td>
                <strong>${server.name}</strong>
            </td>

            <td>
                ${server.port}
            </td>

            <td>
                <span class="status-badge ${statusClass}">
                    ${statusIcon} ${server.status}
                </span>
            </td>

            <td>
                ${server.response_time || 0} ms
            </td>

            <td>
                ${(server.cpu || 0).toFixed(1)}%
            </td>

            <td>
                ${(server.ram || 0).toFixed(1)}%
            </td>

            <td>
                <strong>
                    ${score >= 0 ? score.toFixed(2) : "N/A"}
                </strong>
            </td>

            <td>
                <div>
                    CPU: ${getTrendDisplay(trend.cpu)}
                </div>

                <div>
                    RAM: ${getTrendDisplay(trend.ram)}
                </div>

                <div>
                    Response: ${getTrendDisplay(trend.response_time)}
                </div>
            </td>

        `;


        tbody.appendChild(row);

    });

}


/* =========================================================
   SERVER CARDS
========================================================= */

function updateServerCards(servers) {

    const container =
        document.getElementById("serverCards");


    container.innerHTML = "";


    servers.forEach(server => {

        const statusClass =
            getStatusClass(server.status);


        const statusIcon =
            getStatusIcon(server.status);


        const score =
            Number(server.score ?? -1);


        /*
           Warning messages
        */

        let warningHTML = "";


        if (
            server.warning_messages &&
            server.warning_messages.length > 0
        ) {

            warningHTML = `

                <div class="server-warning-box">

                    <strong>⚠ Early Warning</strong>

                    ${server.warning_messages
                        .map(message =>
                            `<div>${message}</div>`
                        )
                        .join("")}

                </div>

            `;

        }


        /*
           Trends
        */

        const trend =
            server.trend || {};


        const cpuTrend =
            getTrendDisplay(trend.cpu);


        const ramTrend =
            getTrendDisplay(trend.ram);


        const responseTrend =
            getTrendDisplay(trend.response_time);


        const card =
            document.createElement("div");


        card.className = "server-card";


        card.innerHTML = `

            <div class="server-card-top">

                <div>

                    <h3>${server.name}</h3>

                    <p>
                        Backend port ${server.port}
                    </p>

                </div>

                <span class="status-badge ${statusClass}">
                    ${statusIcon} ${server.status}
                </span>

            </div>


            ${warningHTML}


            <div class="server-card-score">

                <span>Smart Score</span>

                <strong>
                    ${score >= 0
                        ? score.toFixed(2)
                        : "N/A"}
                </strong>

            </div>


            <div class="server-card-metric">

                <span>Response Time</span>

                <strong>
                    ${server.response_time || 0} ms
                </strong>

            </div>


            <div class="server-card-metric">

                <span>CPU Usage</span>

                <strong>
                    ${(server.cpu || 0).toFixed(1)}%
                </strong>

            </div>


            <div class="server-card-metric">

                <span>Memory Usage</span>

                <strong>
                    ${(server.ram || 0).toFixed(1)}%
                </strong>

            </div>


            <div class="server-trends">

                <div class="trend-item">

                    <span>CPU Trend</span>

                    <strong>
                        ${cpuTrend}
                    </strong>

                </div>


                <div class="trend-item">

                    <span>RAM Trend</span>

                    <strong>
                        ${ramTrend}
                    </strong>

                </div>


                <div class="trend-item">

                    <span>Response Trend</span>

                    <strong>
                        ${responseTrend}
                    </strong>

                </div>

            </div>

        `;


        container.appendChild(card);

    });

}


/* =========================================================
   TREND DISPLAY
========================================================= */

function getTrendDisplay(trend) {

    if (trend === "Rising") {
        return "📈 Rising";
    }


    if (trend === "Falling") {
        return "📉 Falling";
    }


    return "➡ Stable";

}


/* =========================================================
   METRICS
========================================================= */

async function updateMetrics() {

    try {

        const response =
            await fetch(METRICS_API);


        if (!response.ok) {
            throw new Error("Metrics request failed");
        }


        const data =
            await response.json();


        const rps =
            Number(data.requests_per_second || 0);


        const active =
            Number(data.active_requests || 0);


        const total =
            Number(data.total_requests || 0);


        const success =
            Number(data.successful_requests || 0);


        const failed =
            Number(data.failed_requests || 0);


        const rate =
            Number(data.success_rate ?? 100);


        document.getElementById("requestsPerSecond")
            .textContent = rps;


        document.getElementById("activeRequests")
            .textContent = active;


        document.getElementById("totalRequests")
            .textContent = total;


        document.getElementById("successRate")
            .textContent =
            `${rate.toFixed(2)}%`;


        document.getElementById("analyticsTotal")
            .textContent = total;


        document.getElementById("analyticsSuccess")
            .textContent = success;


        document.getElementById("analyticsFailed")
            .textContent = failed;


        document.getElementById("analyticsRate")
            .textContent =
            `${rate.toFixed(2)}%`;


        updateChart(rps);

    }


    catch (error) {

        console.error(
            "Metrics error:",
            error
        );

    }

}


/* =========================================================
   CHART
========================================================= */

function createChart() {

    const canvas =
        document.getElementById("trafficChart");


    if (!canvas) {
        return;
    }


    if (typeof Chart === "undefined") {

        console.warn(
            "Chart.js could not be loaded."
        );

        return;

    }


    const context =
        canvas.getContext("2d");


    chart = new Chart(context, {

        type: "line",


        data: {

            labels: [],


            datasets: [

                {

                    label: "Requests / Sec",

                    data: [],

                    borderColor: "#4f8cff",

                    backgroundColor:
                        "rgba(79,140,255,.08)",

                    fill: true,

                    tension: 0.4,

                    borderWidth: 2,

                    pointRadius: 2

                }

            ]

        },


        options: {

            responsive: true,

            maintainAspectRatio: false,

            animation: false,


            plugins: {

                legend: {

                    labels: {

                        color: "#8d99aa",

                        font: {
                            size: 10
                        }

                    }

                }

            },


            scales: {

                x: {

                    ticks: {

                        color: "#667386",

                        font: {
                            size: 9
                        }

                    },


                    grid: {
                        color:
                            "rgba(255,255,255,.04)"
                    }

                },


                y: {

                    beginAtZero: true,


                    ticks: {

                        color: "#667386",

                        font: {
                            size: 9
                        }

                    },


                    grid: {
                        color:
                            "rgba(255,255,255,.04)"
                    }

                }

            }

        }

    });

}


/* =========================================================
   UPDATE CHART
========================================================= */

function updateChart(value) {

    if (!chart) {
        return;
    }


    const now =
        new Date().toLocaleTimeString([], {

            minute: "2-digit",

            second: "2-digit"

        });


    chart.data.labels.push(now);


    chart.data.datasets[0].data.push(value);


    if (chart.data.labels.length > 20) {

        chart.data.labels.shift();

        chart.data.datasets[0].data.shift();

    }


    chart.update("none");

}


/* =========================================================
   LOGS
========================================================= */

async function updateLogs() {

    try {

        const response =
            await fetch(LOGS_API);


        if (!response.ok) {
            throw new Error("Logs request failed");
        }


        const data =
            await response.json();


        renderLogs(data.logs || []);

    }


    catch (error) {

        console.error(
            "Logs error:",
            error
        );

    }

}


/* =========================================================
   RENDER LOGS
========================================================= */

function renderLogs(logs) {

    const container =
        document.getElementById("logsContainer");


    if (!logs.length) {

        container.innerHTML = `
            <div class="empty-logs">
                No requests yet.
            </div>
        `;

        return;

    }


    container.innerHTML = "";


    [...logs].reverse().forEach(log => {

        const row =
            document.createElement("div");


        row.className = "log-row";


        const time =
            new Date(
                Number(log.time) * 1000
            ).toLocaleTimeString();


        const statusClass =
            log.status === "Success"
                ? "log-success"
                : "log-failed";


        row.innerHTML = `

            <span class="log-time">
                ${time}
            </span>

            <span class="log-server">
                ${log.server || "Unknown"}
            </span>

            <span class="${statusClass}">
                ${log.status || "Unknown"}
            </span>

            <span>
                ${log.response_time || 0} ms
            </span>

        `;


        container.appendChild(row);

    });

}


/* =========================================================
   TEST REQUEST
========================================================= */

document
    .getElementById("testRequestBtn")
    .addEventListener("click", async () => {

        try {

            const response =
                await fetch(PROXY_API);


            if (!response.ok) {

                throw new Error(
                    "Proxy request failed"
                );

            }


            const data =
                await response.json();


            console.log(
                "FlexiProxy response:",
                data
            );


            await updateMetrics();

            await updateLogs();

            await updateStatus();

        }


        catch (error) {

            console.error(
                "Test request failed:",
                error
            );


            alert(
                "Could not connect to FlexiProxy backend."
            );

        }

    });


/* =========================================================
   LIVE TRAFFIC BUTTON
========================================================= */

document
    .getElementById("trafficBtn")
    .addEventListener("click", () => {

        if (trafficRunning) {

            stopTraffic();

        }

        else {

            startTraffic();

        }

    });


/* =========================================================
   START LIVE TRAFFIC
========================================================= */

function startTraffic() {

    trafficRunning = true;


    const button =
        document.getElementById("trafficBtn");


    button.textContent =
        "■ Stop Live Traffic";


    sendTrafficRequest();


    trafficInterval =
        setInterval(
            sendTrafficRequest,
            1000
        );

}


/* =========================================================
   STOP LIVE TRAFFIC
========================================================= */

function stopTraffic() {

    trafficRunning = false;


    const button =
        document.getElementById("trafficBtn");


    button.textContent =
        "▶ Start Live Traffic";


    if (trafficInterval) {

        clearInterval(
            trafficInterval
        );

        trafficInterval = null;

    }

}


/* =========================================================
   SEND LIVE TRAFFIC REQUEST
========================================================= */

async function sendTrafficRequest() {

    try {

        const response =
            await fetch(PROXY_API);


        if (!response.ok) {

            throw new Error(
                "Traffic request failed"
            );

        }


        const data =
            await response.json();


        console.log(
            "Live traffic:",
            data
        );


        await updateMetrics();

        await updateLogs();


        /*
           Refresh health as well.
           This allows the dashboard to show
           Warning / Critical changes during traffic.
        */

        await updateStatus();

    }


    catch (error) {

        console.error(
            "Traffic request failed:",
            error
        );

    }

}


/* =========================================================
   INITIALIZATION
========================================================= */

async function initialize() {

    createChart();

    await updateStatus();

    await updateMetrics();

    await updateLogs();

}


/* =========================================================
   AUTO REFRESH
========================================================= */

setInterval(
    updateStatus,
    3000
);


setInterval(
    updateMetrics,
    1000
);


setInterval(
    updateLogs,
    3000
);


/* =========================================================
   START APPLICATION
========================================================= */

initialize();
```
