from fastapi import FastAPI
import uvicorn
import sys
import psutil

server_number = int(sys.argv[1])

app = FastAPI()

server_name = f"Server {server_number}"


@app.get("/")
def home():
    return {
        "server": server_name,
        "message": f"Hello from Backend {server_name}"
    }


@app.get("/health")
def health():
    return {
        "server": server_name,
        "status": "healthy",
        "cpu": psutil.cpu_percent(),
        "ram": psutil.virtual_memory().percent
    }


@app.get("/data")
def data():
    return {
        "server": server_name,
        "message": "Request successfully processed"
    }


if __name__ == "__main__":

    port = 8000 + server_number

    print("--------------------------------")
    print(f"Backend {server_name}")
    print(f"Running on port {port}")
    print("--------------------------------")

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=port
    )