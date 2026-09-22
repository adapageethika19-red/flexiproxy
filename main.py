from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

import httpx
import psutil
import time


# =========================================================
# FLEXIPROXY APPLICATION
# =========================================================

app = FastAPI(
    title="FlexiProxy",
    description="Smart Reverse Proxy with Load Balancing and Health Monitoring",
    version="1.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# BACKEND SERVERS
# =========================================================

servers = [
    {
        "name": "Server 1",
        "url": "http://127.0.0.1:8001",
        "port": 8001,
        "status": "Unknown",
        "response_time": 0,
        "cpu": 0,
        "ram": 0
    },
    {
        "name": "Server 2",
        "url": "http://127.0.0.1:8002",
        "port": 8002,
        "status": "Unknown",
        "response_time": 0,
        "cpu": 0,
        "ram": 0
    },
    {
        "name": "Server 3",
        "url": "http://127.0.0.1:8003",
        "port": 8003,
        "status": "Unknown",
        "response_time": 0,
        "cpu": 0,
        "ram": 0
    }
]


# =========================================================
# LOAD BALANCER STATE
# =========================================================

current_server = 0


# =========================================================
# REQUEST METRICS
# =========================================================

total_requests = 0
successful_requests = 0
failed_requests = 0
active_requests = 0

request_history = []


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def home():

    return {
        "proxy": "FlexiProxy",
        "message": "FlexiProxy Backend is Running!",
        "port": 8080,
        "servers": 3,
        "load_balancing": "Round Robin",
        "health_monitoring": "Enabled"
    }


# =========================================================
# HEALTH MONITORING
# =========================================================

@app.get("/api/status")
async def status():

    async with httpx.AsyncClient(timeout=2.0) as client:

        for server in servers:

            try:

                start_time = time.time()

                response = await client.get(
                    server["url"] + "/health"
                )

                end_time = time.time()

                response_time = round(
                    (end_time - start_time) * 1000
                )

                server["response_time"] = response_time

                if response.status_code == 200:

                    health_data = response.json()

                    server["cpu"] = health_data.get(
                        "cpu",
                        0
                    )

                    server["ram"] = health_data.get(
                        "ram",
                        0
                    )

                    # Warning conditions
                    if server["cpu"] > 90:

                        server["status"] = "Warning"

                    elif server["ram"] > 90:

                        server["status"] = "Warning"

                    elif server["response_time"] > 500:

                        server["status"] = "Warning"

                    else:

                        server["status"] = "Healthy"

                else:

                    server["status"] = "Warning"

            except Exception:

                server["status"] = "Offline"

                server["response_time"] = 0
                server["cpu"] = 0
                server["ram"] = 0


    # Count healthy/warning servers

    healthy_servers = [
        server
        for server in servers
        if server["status"] in [
            "Healthy",
            "Warning"
        ]
    ]


    return {

        "proxy": "FlexiProxy",

        "status": "Running",

        "proxy_port": 8080,

        "load_balancing": "Round Robin",

        "health_monitoring": True,

        "cpu": psutil.cpu_percent(),

        "ram": psutil.virtual_memory().percent,

        "server_count": len(servers),

        "healthy_servers": len(
            healthy_servers
        ),

        "servers": servers
    }


# =========================================================
# ROUND ROBIN SERVER SELECTION
# =========================================================

def get_next_server():

    global current_server

    total_servers = len(servers)

    if total_servers == 0:
        return None


    for _ in range(total_servers):

        server = servers[current_server]

        current_server = (
            current_server + 1
        ) % total_servers


        # Only use servers that are not offline

        if server["status"] != "Offline":

            return server


    return None


# =========================================================
# PROXY REQUEST + AUTOMATIC FAILOVER
# =========================================================

@app.get("/proxy")
async def proxy_request():

    global total_requests
    global successful_requests
    global failed_requests
    global active_requests


    total_requests += 1

    active_requests += 1

    request_start = time.time()


    # Keep track of servers already tried

    tried_servers = []


    # Try every available server if necessary

    for _ in range(len(servers)):

        server = get_next_server()


        # No server available

        if server is None:

            break


        # Avoid trying the same server twice

        if server["name"] in tried_servers:

            continue


        tried_servers.append(
            server["name"]
        )


        try:

            # Send request to backend

            async with httpx.AsyncClient(
                timeout=3.0
            ) as client:

                response = await client.get(
                    server["url"] + "/"
                )


            # Calculate response time

            request_end = time.time()

            response_time = round(
                (request_end - request_start) * 1000
            )


            # Successful request

            successful_requests += 1

            active_requests -= 1


            # Mark server healthy

            server["status"] = "Healthy"

            server["response_time"] = response_time


            # Save request log

            request_history.append({

                "time": request_end,

                "server": server["name"],

                "response_time": response_time,

                "status": "Success"

            })


            # Keep only latest 500 logs

            if len(request_history) > 500:

                request_history.pop(0)


            # Return response

            return {

                "proxy": "FlexiProxy",

                "status": "Success",

                "routed_to": server["name"],

                "backend_port": server["port"],

                "response_time": response_time,

                "failover": len(
                    tried_servers
                ) > 1,

                "backend_response": response.json()

            }


        except Exception:

            # -------------------------------------------------
            # SERVER FAILURE
            # -------------------------------------------------

            server["status"] = "Offline"

            server["response_time"] = 0

            server["cpu"] = 0

            server["ram"] = 0


            # Continue to next server

            continue


    # =========================================================
    # ALL SERVERS FAILED
    # =========================================================

    failed_requests += 1

    active_requests -= 1


    request_history.append({

        "time": time.time(),

        "server": "None",

        "response_time": 0,

        "status": "Failed"

    })


    return JSONResponse(

        status_code=503,

        content={

            "proxy": "FlexiProxy",

            "status": "Failed",

            "error": "No healthy backend servers available"

        }

    )


# =========================================================
# METRICS
# =========================================================

@app.get("/api/metrics")
async def metrics():

    current_time = time.time()


    # Requests received during the last 1 second

    recent_requests = [

        request

        for request in request_history

        if current_time - request["time"] <= 1

    ]


    requests_per_second = len(
        recent_requests
    )


    # Calculate success rate

    if total_requests > 0:

        success_rate = round(

            (
                successful_requests
                /
                total_requests
                *
                100
            ),

            2

        )

    else:

        success_rate = 100


    return {

        "total_requests":
            total_requests,

        "successful_requests":
            successful_requests,

        "failed_requests":
            failed_requests,

        "active_requests":
            active_requests,

        "requests_per_second":
            requests_per_second,

        "success_rate":
            success_rate

    }


# =========================================================
# LOGS
# =========================================================

@app.get("/api/logs")
async def logs():

    recent_logs = request_history[-20:]


    return {

        "logs": recent_logs

    }


# =========================================================
# SERVER DETAILS
# =========================================================

@app.get("/api/servers")
async def server_details():

    return {

        "count": len(servers),

        "servers": servers

    }


# =========================================================
# START FLEXIPROXY
# =========================================================

if __name__ == "__main__":

    import uvicorn


    print("")

    print(
        "======================================"
    )

    print(
        "        FLEXIPROXY BACKEND"
    )

    print(
        "======================================"
    )

    print(
        "Proxy running on port 8080"
    )

    print(
        "Load Balancing : Enabled"
    )

    print(
        "Health Monitor : Enabled"
    )

    print(
        "Automatic Failover : Enabled"
    )

    print(
        "Servers        : 3"
    )

    print(
        "======================================"
    )

    print("")


    uvicorn.run(

        app,

        host="0.0.0.0",

        port=8080

    )