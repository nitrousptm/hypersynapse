#!/usr/bin/env python3
"""
Agentix Agent System — Interactive Demo
Visualize the hierarchical agent system and simulate task flows.
"""

import tkinter as tk
from tkinter import ttk, messagebox
import json
from dataclasses import dataclass
from typing import List, Dict
from enum import Enum
import time

# ============================================================================
# Data Models
# ============================================================================

class AgentType(Enum):
    ORCHESTRATOR = "orchestrator"
    MANAGER = "manager"
    SPECIALIST = "specialist"


@dataclass
class Agent:
    name: str
    agent_type: AgentType
    role: str
    parent: str = None
    color: str = None

    def __post_init__(self):
        if self.color is None:
            colors = {
                AgentType.ORCHESTRATOR: "#FF6B6B",
                AgentType.MANAGER: "#4ECDC4",
                AgentType.SPECIALIST: "#95E1D3"
            }
            self.color = colors[self.agent_type]


@dataclass
class Task:
    id: str
    title: str
    from_agent: str
    to_agent: str
    status: str = "pending"  # pending, assigned, in_progress, done
    timestamp: float = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()


# ============================================================================
# Agentix Hierarchy (Default Data)
# ============================================================================

AGENTS = {
    # Orchestrators
    "CEO": Agent("CEO", AgentType.ORCHESTRATOR, "Chief Executive Officer"),
    "CTO": Agent("CTO", AgentType.ORCHESTRATOR, "Chief Technology Officer", parent="CEO"),
    "HR": Agent("HR Agent", AgentType.ORCHESTRATOR, "Health & Monitoring", parent="CEO"),

    # Managers
    "Backend Manager": Agent("Backend Manager", AgentType.MANAGER, "Backend Coordination", parent="CTO"),
    "Frontend Manager": Agent("Frontend Manager", AgentType.MANAGER, "Frontend Coordination", parent="CTO"),
    "DevOps Manager": Agent("DevOps Manager", AgentType.MANAGER, "Infrastructure & Deployment", parent="CTO"),
    "QA Manager": Agent("QA Manager", AgentType.MANAGER, "Quality Assurance", parent="CTO"),

    # Backend Specialists
    "API Specialist": Agent("API Specialist", AgentType.SPECIALIST, "REST/GraphQL APIs", parent="Backend Manager"),
    "Database Specialist": Agent("DB Specialist", AgentType.SPECIALIST, "Database Schema & Queries", parent="Backend Manager"),
    "Performance Specialist": Agent("Perf Specialist", AgentType.SPECIALIST, "Optimization & Caching", parent="Backend Manager"),

    # Frontend Specialists
    "UI Specialist": Agent("UI Specialist", AgentType.SPECIALIST, "UI Components", parent="Frontend Manager"),
    "UX Specialist": Agent("UX Specialist", AgentType.SPECIALIST, "User Experience", parent="Frontend Manager"),

    # QA Specialists
    "Test Engineer": Agent("Test Engineer", AgentType.SPECIALIST, "Testing & QA", parent="QA Manager"),
    "Automation Specialist": Agent("Automation Specialist", AgentType.SPECIALIST, "Test Automation", parent="QA Manager"),
}


# ============================================================================
# Scenario: "Build Payment API"
# ============================================================================

SCENARIO_PAYMENT_API = {
    "title": "Build Payment API with Database",
    "user_request": "Implement Stripe payment integration with database storage",
    "tasks": [
        Task("ceo-1", "Receive & decompose payment integration request", "User", "CEO"),
        Task("cto-1", "Engineering task: payment integration", "CEO", "CTO"),
        Task("be-1", "Payment backend implementation", "CTO", "Backend Manager"),
        Task("be-db-1", "Design payments table schema", "Backend Manager", "Database Specialist"),
        Task("be-api-1", "Implement payment endpoints", "Backend Manager", "API Specialist"),
        Task("be-perf-1", "Optimize payment queries", "Backend Manager", "Performance Specialist"),
        Task("fe-1", "Payment UI & integration", "CTO", "Frontend Manager"),
        Task("qa-1", "E2E payment testing", "CTO", "QA Manager"),
    ]
}


# ============================================================================
# Main Demo Application
# ============================================================================

class AgentixDemoApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Agentix Agent System — Interactive Demo")
        self.root.geometry("1400x900")
        self.root.configure(bg="#F5F5F5")

        self.agents = AGENTS
        self.current_scenario = None
        self.task_log = []
        self.animation_running = False

        # Styling
        style = ttk.Style()
        style.theme_use('clam')
        style.configure('Title.TLabel', font=('Helvetica', 16, 'bold'), background='#F5F5F5')
        style.configure('Normal.TLabel', font=('Helvetica', 10), background='#F5F5F5')

        self.setup_ui()

    def setup_ui(self):
        """Create main UI layout"""

        # Header
        header = ttk.Frame(self.root)
        header.pack(fill=tk.X, padx=20, pady=10)
        ttk.Label(header, text="🤖 Agentix Agent System — Interactive Demo",
                 style='Title.TLabel').pack(side=tk.LEFT)

        # Main container
        main = ttk.Frame(self.root)
        main.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)

        # Left: Hierarchy visualization
        left = ttk.Frame(main)
        left.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 10))

        ttk.Label(left, text="Agent Hierarchy", style='Title.TLabel').pack(anchor=tk.W, pady=(0, 10))

        self.hierarchy_canvas = tk.Canvas(left, bg='white', height=400)
        self.hierarchy_canvas.pack(fill=tk.BOTH, expand=True)
        self.hierarchy_canvas.bind("<Configure>", self.on_canvas_resize)

        # Right: Control & Log
        right = ttk.Frame(main)
        right.pack(side=tk.RIGHT, fill=tk.BOTH, expand=False, width=400)

        # Scenario selection
        ttk.Label(right, text="Scenario", style='Title.TLabel').pack(anchor=tk.W, pady=(0, 10))

        button_frame = ttk.Frame(right)
        button_frame.pack(fill=tk.X, pady=(0, 20))

        ttk.Button(button_frame, text="▶ Run: Payment API",
                  command=self.run_payment_scenario).pack(fill=tk.X, pady=5)
        ttk.Button(button_frame, text="⏹ Stop",
                  command=self.stop_scenario).pack(fill=tk.X, pady=5)

        # Task Log
        ttk.Label(right, text="Task Flow Log", style='Title.TLabel').pack(anchor=tk.W, pady=(20, 10))

        log_frame = ttk.Frame(right)
        log_frame.pack(fill=tk.BOTH, expand=True)

        scrollbar = ttk.Scrollbar(log_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        self.task_log_widget = tk.Listbox(log_frame, yscrollcommand=scrollbar.set,
                                          height=20, font=('Courier', 9))
        self.task_log_widget.pack(fill=tk.BOTH, expand=True)
        scrollbar.config(command=self.task_log_widget.yview)

        # Footer
        footer = ttk.Frame(self.root)
        footer.pack(fill=tk.X, padx=20, pady=10)
        ttk.Label(footer, text="Click 'Run: Payment API' to see the agent system in action!",
                 style='Normal.TLabel').pack(anchor=tk.W)

    def on_canvas_resize(self, event):
        """Redraw hierarchy when canvas resizes"""
        if not self.animation_running:
            self.draw_hierarchy()

    def draw_hierarchy(self):
        """Draw agent hierarchy on canvas"""
        canvas = self.hierarchy_canvas
        canvas.delete("all")

        # Define positions (orchestrators, managers, specialists)
        positions = {}

        # Orchestrators (top row)
        orchestrators = [a for a in self.agents.values() if a.agent_type == AgentType.ORCHESTRATOR]
        for i, agent in enumerate(orchestrators):
            x = 100 + i * 150
            y = 50
            positions[agent.name] = (x, y)

        # Managers (middle row)
        managers = [a for a in self.agents.values() if a.agent_type == AgentType.MANAGER]
        for i, agent in enumerate(managers):
            x = 150 + i * 120
            y = 200
            positions[agent.name] = (x, y)

        # Specialists (bottom rows)
        specialists = [a for a in self.agents.values() if a.agent_type == AgentType.SPECIALIST]
        for i, agent in enumerate(specialists):
            row = i // 4
            col = i % 4
            x = 100 + col * 120
            y = 350 + row * 80
            positions[agent.name] = (x, y)

        # Draw connections
        for agent in self.agents.values():
            if agent.parent and agent.parent in positions:
                x1, y1 = positions[agent.name]
                x2, y2 = positions[agent.parent]
                canvas.create_line(x1, y1, x2, y2, fill='#CCCCCC', width=2)

        # Draw agents
        for agent in self.agents.values():
            if agent.name in positions:
                x, y = positions[agent.name]

                # Box
                w, h = 90, 50
                canvas.create_rectangle(x - w/2, y - h/2, x + w/2, y + h/2,
                                       fill=agent.color, outline='#333', width=2)

                # Text
                canvas.create_text(x, y - 10, text=agent.name, font=('Helvetica', 9, 'bold'),
                                  fill='white')
                canvas.create_text(x, y + 10, text=agent.role, font=('Helvetica', 7),
                                  fill='white')

    def run_payment_scenario(self):
        """Run the payment API scenario"""
        if self.animation_running:
            messagebox.showwarning("Warning", "Scenario already running!")
            return

        self.animation_running = True
        self.task_log = []
        self.task_log_widget.delete(0, tk.END)
        self.current_scenario = SCENARIO_PAYMENT_API

        # Log initial request
        self.log_task(f"[USER REQUEST] {self.current_scenario['user_request']}")
        self.log_task("")

        # Schedule task progression
        self.root.after(1000, self.progress_tasks)

    def progress_tasks(self):
        """Animate task progression through agents"""
        if not self.animation_running or not self.current_scenario:
            return

        tasks = self.current_scenario['tasks']

        # Progress each task
        for i, task in enumerate(tasks):
            if task.status == "pending":
                task.status = "assigned"
                self.log_task(f"[{i+1}] {task.from_agent} → {task.to_agent}")
                self.log_task(f"     📋 Task: {task.title}")
                self.log_task("")

                # Schedule next progression
                self.root.after(2000 + i * 1500, self.complete_task, i)
                break

    def complete_task(self, task_index):
        """Mark task as done"""
        if not self.animation_running or not self.current_scenario:
            return

        tasks = self.current_scenario['tasks']
        if task_index < len(tasks):
            task = tasks[task_index]
            task.status = "done"
            self.log_task(f"     ✅ Done: {task.title}")
            self.log_task("")

            # Progress to next
            self.root.after(500, self.progress_tasks)

    def log_task(self, message):
        """Add message to task log"""
        self.task_log_widget.insert(tk.END, message)
        self.task_log_widget.see(tk.END)
        self.task_log_widget.update()

    def stop_scenario(self):
        """Stop current scenario"""
        self.animation_running = False
        self.log_task("")
        self.log_task("[STOPPED]")


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    root = tk.Tk()
    app = AgentixDemoApp(root)
    root.mainloop()
