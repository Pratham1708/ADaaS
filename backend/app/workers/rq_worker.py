"""RQ worker for processing analysis jobs."""
import os
import sys
from pathlib import Path

# Add parent directory to path for imports
backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from redis import Redis
from rq import Worker, Queue, Connection

# Redis connection
redis_host = os.getenv("REDIS_HOST", "localhost")
redis_port = int(os.getenv("REDIS_PORT", "6379"))
redis_password = os.getenv("REDIS_PASSWORD", None)

if __name__ == "__main__":
    print(f"Starting RQ worker, connecting to Redis at {redis_host}:{redis_port}")
    
    redis_conn = Redis(
        host=redis_host,
        port=redis_port,
        password=redis_password,
        ssl=True if redis_password else False,
        ssl_cert_reqs=None  # Upstash doesn't require cert verification
    )
    
    with Connection(redis_conn):
        worker = Worker(['default'])
        worker.work()
