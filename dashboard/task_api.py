"""Task update helper for HYPERSYNAPSE agents/routines.

Usage:
    from task_api import TaskUpdate

    # Start a task
    task = TaskUpdate(agent="shader_specialist", title="SDF Library Refactor")
    task.start()

    # Update progress with current step
    task.update(step="Writing primitive definitions", progress=0.25)
    task.update(step="Testing smooth unions", progress=0.50)
    task.update(step="Integrating into shaders", progress=0.75)

    # Mark as done
    task.finish()

    # Or mark as blocked
    task.block(reason="Awaiting compiler output")
"""

import requests
import json
import time
from typing import Optional
from pathlib import Path


class TaskUpdate:
    """Manage task lifecycle via dashboard API."""

    DASHBOARD_BASE = "http://localhost:8088"

    def __init__(
        self,
        agent: str,
        title: str,
        detail: Optional[str] = None,
        task_id: Optional[str] = None,
    ):
        self.agent = agent
        self.title = title
        self.detail = detail
        self.task_id = task_id or f"t-{int(time.time()*1000)}"
        self.status = "pending"

    def update(
        self,
        status: Optional[str] = None,
        progress: Optional[float] = None,
        step: Optional[str] = None,
        detail: Optional[str] = None,
    ) -> dict:
        """Update task status. Clamps progress to [0,1]."""
        payload = {
            "id": self.task_id,
            "agent": self.agent,
            "title": self.title,
            "status": status or self.status or "running",
        }

        if detail or self.detail:
            payload["detail"] = detail or self.detail

        if progress is not None:
            payload["progress"] = max(0.0, min(1.0, progress))

        if step:
            payload["step"] = step

        try:
            resp = requests.post(
                f"{self.DASHBOARD_BASE}/api/tasks", json=payload, timeout=2
            )
            if resp.status_code == 200:
                self.status = payload["status"]
                print(
                    f"[task] {self.agent:20s} | {status or 'update':10s} | {step or self.title}"
                )
                return resp.json()
        except Exception as e:
            print(f"[task] ERROR posting to dashboard: {e}")
        return {}

    def start(self) -> dict:
        """Mark task as running."""
        return self.update(status="running", progress=0.0)

    def finish(self, detail: Optional[str] = None) -> dict:
        """Mark task as done."""
        return self.update(status="done", progress=1.0, detail=detail)

    def block(self, reason: str = "Waiting for upstream") -> dict:
        """Mark task as blocked."""
        return self.update(
            status="blocked", step=reason, detail=f"Blocked: {reason}"
        )

    def progress_range(self, min_val: float = 0.0, max_val: float = 1.0):
        """Context manager for progress bar over a range.

        Usage:
            with task.progress_range(0.25, 0.75) as progress:
                for i, item in enumerate(items):
                    progress(i / len(items))
                    do_work(item)
        """

        def setter(frac: float):
            """Interpolate [0,1] to [min_val, max_val]."""
            actual = min_val + frac * (max_val - min_val)
            self.update(progress=actual)

        class _ProgressContext:
            def __enter__(self):
                return setter

            def __exit__(self, *args):
                pass

        return _ProgressContext()


if __name__ == "__main__":
    # Example: Simulate a 5-step task
    task = TaskUpdate(
        agent="procedural_specialist",
        title="Example Task",
        detail="This is a test task to show progress updates",
    )
    task.start()

    steps = [
        "Step 1: Initialize",
        "Step 2: Process data",
        "Step 3: Validate results",
        "Step 4: Optimize",
        "Step 5: Finalize",
    ]

    for i, step in enumerate(steps):
        progress = (i + 1) / len(steps)
        task.update(step=step, progress=progress)
        time.sleep(0.5)  # Simulate work

    task.finish(detail="Task completed successfully")
