"""
Restora Full-Stack Development Runner
Starts both the FastAPI Backend and the Vite React Frontend concurrently.
"""
import sys
import os
import subprocess
import threading
import signal
import time

def stream_output(process, prefix):
    try:
        for line in iter(process.stdout.readline, ''):
            if not line:
                break
            print(f"{prefix} {line.rstrip()}", flush=True)
    except Exception:
        pass

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")

    print("=" * 70, flush=True)
    print("  RESTORA — FULL-STACK DEVELOPMENT RUNNER (dev:all)", flush=True)
    print("=" * 70, flush=True)
    print("  Backend API & Production UI:  http://localhost:8000", flush=True)
    print("  Frontend Vite Live Dev HMR:   http://localhost:5173", flush=True)
    print("  Interactive Swagger Docs:     http://localhost:8000/docs", flush=True)
    print("-" * 70, flush=True)
    print("  Press CTRL+C at any time to gracefully stop all services.", flush=True)
    print("=" * 70, flush=True)

    # Detect platform commands
    is_win = sys.platform.startswith("win")
    npm_cmd = "npm.cmd" if is_win else "npm"
    python_cmd = sys.executable

    # 1. Start Backend process
    backend_proc = subprocess.Popen(
        [python_cmd, "run_dev.py"],
        cwd=root_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    # 2. Start Frontend Vite process
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=frontend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    # Stream outputs in background threads
    t_backend = threading.Thread(target=stream_output, args=(backend_proc, "[BACKEND]"), daemon=True)
    t_frontend = threading.Thread(target=stream_output, args=(frontend_proc, "[FRONTEND]"), daemon=True)
    t_backend.start()
    t_frontend.start()

    def cleanup():
        print("\nShutting down Restora services...", flush=True)
        for proc in [frontend_proc, backend_proc]:
            try:
                if is_win:
                    subprocess.call(["taskkill", "/F", "/T", "/PID", str(proc.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    proc.terminate()
            except Exception:
                pass

    try:
        while True:
            # Check if any process terminated prematurely
            if backend_proc.poll() is not None:
                print(f"[BACKEND] Exited with code {backend_proc.poll()}", flush=True)
                break
            if frontend_proc.poll() is not None:
                print(f"[FRONTEND] Exited with code {frontend_proc.poll()}", flush=True)
                break
            time.sleep(0.5)
    except KeyboardInterrupt:
        pass
    finally:
        cleanup()
        print("Restora dev services stopped cleanly.", flush=True)

if __name__ == "__main__":
    main()
