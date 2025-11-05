import tkinter as tk
from tkinter import messagebox
import psutil
import time
from datetime import datetime
import threading
import win32gui
import win32process

class GhostMonitor:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Ghost Monitor")
        self.root.geometry("800x600")
        self.root.configure(bg='black')
        
        self.last_app = ""
        self.setup_ui()
        self.ask_permission()
    
    def setup_ui(self):
        # Title
        title_label = tk.Label(
            self.root, 
            text="RAGNING MONITOR",
            fg="#00FF00",
            bg="black",
            font=("Arial", 20, "bold")
        )
        title_label.pack(pady=20)
        
        # Status
        status_label = tk.Label(
            self.root,
            text="● ACTIVE",
            fg="#00FF00", 
            bg="black",
            font=("Arial", 12, "bold")
        )
        status_label.pack()
        
        # Current App Frame
        current_frame = tk.Frame(self.root, bg="black")
        current_frame.pack(pady=20)
        
        current_title = tk.Label(
            current_frame,
            text="CURRENT ACTIVE WINDOW:",
            fg="white",
            bg="black",
            font=("Arial", 12, "bold")
        )
        current_title.pack()
        
        self.current_app_label = tk.Label(
            current_frame,
            text="Waiting for permission...",
            fg="#00FF00",
            bg="black", 
            font=("Arial", 11),
            wraplength=700
        )
        self.current_app_label.pack(pady=5)
        
        # Activity Log
        log_title = tk.Label(
            self.root,
            text="ACTIVITY LOG:",
            fg="white",
            bg="black",
            font=("Arial", 12, "bold")
        )
        log_title.pack()
        
        # Log area
        self.log_text = tk.Text(
            self.root,
            height=15,
            width=90,
            bg="#1a1a1a",
            fg="#00FF00",
            font=("Arial", 9)
        )
        self.log_text.pack(pady=10)
        
        # Back button
        back_btn = tk.Button(
            self.root,
            text="← BACK",
            command=self.root.destroy,
            bg="#333333",
            fg="#00FF00",
            font=("Arial", 10)
        )
        back_btn.place(x=20, y=20)
    
    def ask_permission(self):
        result = messagebox.askyesno(
            "Permission Request",
            "Ghost Monitor wants to monitor your active windows and applications.\n\nAllow monitoring permissions?"
        )
        
        if result:
            self.add_log("✅ Permission granted - Real monitoring started")
            self.add_log("🔍 Tracking active windows and applications...")
            self.start_monitoring()
        else:
            self.current_app_label.config(text="Monitoring disabled - Permission denied")
            self.add_log("❌ Permission denied - Monitoring disabled")
    
    def start_monitoring(self):
        # Start monitoring in separate thread
        monitor_thread = threading.Thread(target=self.monitor_loop, daemon=True)
        monitor_thread.start()
    
    def monitor_loop(self):
        while True:
            try:
                # Get active window
                window = win32gui.GetForegroundWindow()
                title = win32gui.GetWindowText(window)
                
                if title:
                    # Get process name
                    _, pid = win32process.GetWindowThreadProcessId(window)
                    process = psutil.Process(pid)
                    app_name = process.name()
                    
                    current_app = f"{app_name} - {title}"
                    
                    # Update UI in main thread
                    self.root.after(0, self.update_current_app, current_app)
                    
                    # Log if app changed
                    if current_app != self.last_app:
                        self.root.after(0, self.add_log, f"🖥️ {current_app}")
                        self.last_app = current_app
                
            except Exception as e:
                self.root.after(0, self.add_log, f"💥 Error: {str(e)}")
            
            time.sleep(3)  # Check every 3 seconds
    
    def update_current_app(self, app_info):
        self.current_app_label.config(text=app_info)
    
    def add_log(self, message):
        timestamp = datetime.now().strftime("%I:%M:%S %p")
        log_entry = f"{message} - {timestamp}\n"
        
        # Insert at beginning and keep only 20 lines
        self.log_text.insert("1.0", log_entry)
        lines = self.log_text.get("1.0", "end-1c").split('\n')
        if len(lines) > 20:
            self.log_text.delete("20.0", "end")
    
    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    app = GhostMonitor()
    app.run()