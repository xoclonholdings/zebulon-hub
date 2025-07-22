#!/usr/bin/env python3
"""
Zed AI Desktop Application
A standalone desktop app for communicating with Zed AI through the Zebulon system.
"""

import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
import requests
import json
import threading
import time
from datetime import datetime
import sys
import os

class ZedDesktopApp:
    def __init__(self, root):
        self.root = root
        self.setup_ui()
        self.zebulon_url = "http://localhost:5000"  # Default Zebulon server
        self.user_id = 1
        self.is_connected = False
        self.check_connection()
        
    def setup_ui(self):
        self.root.title("Zed AI Desktop Assistant")
        self.root.geometry("800x600")
        self.root.configure(bg='#1a1a1a')
        
        # Configure style for dark theme
        style = ttk.Style()
        style.theme_use('clam')
        style.configure('Dark.TFrame', background='#2d2d2d')
        style.configure('Dark.TLabel', background='#2d2d2d', foreground='white')
        style.configure('Dark.TButton', background='#4ecdc4', foreground='white')
        
        # Header
        header_frame = ttk.Frame(self.root, style='Dark.TFrame')
        header_frame.pack(fill='x', padx=10, pady=5)
        
        title_label = ttk.Label(header_frame, text="Zed AI Desktop Assistant", 
                               font=('Arial', 16, 'bold'), style='Dark.TLabel')
        title_label.pack(side='left')
        
        self.status_label = ttk.Label(header_frame, text="Disconnected", 
                                     style='Dark.TLabel')
        self.status_label.pack(side='right')
        
        # Chat area
        chat_frame = ttk.Frame(self.root, style='Dark.TFrame')
        chat_frame.pack(fill='both', expand=True, padx=10, pady=5)
        
        self.chat_display = scrolledtext.ScrolledText(
            chat_frame, 
            bg='#1a1a1a', 
            fg='white',
            font=('Consolas', 10),
            wrap='word',
            state='disabled'
        )
        self.chat_display.pack(fill='both', expand=True)
        
        # Input area
        input_frame = ttk.Frame(self.root, style='Dark.TFrame')
        input_frame.pack(fill='x', padx=10, pady=5)
        
        self.message_entry = tk.Entry(
            input_frame, 
            bg='#2d2d2d', 
            fg='white', 
            font=('Arial', 11),
            insertbackground='white'
        )
        self.message_entry.pack(side='left', fill='x', expand=True, padx=(0, 5))
        self.message_entry.bind('<Return>', self.send_message)
        
        send_button = ttk.Button(input_frame, text="Send to Zed", 
                                command=self.send_message, style='Dark.TButton')
        send_button.pack(side='right')
        
        # Quick actions frame
        actions_frame = ttk.Frame(self.root, style='Dark.TFrame')
        actions_frame.pack(fill='x', padx=10, pady=5)
        
        ttk.Label(actions_frame, text="Quick Actions:", style='Dark.TLabel').pack(side='left')
        
        ttk.Button(actions_frame, text="System Status", 
                  command=self.get_system_status, style='Dark.TButton').pack(side='left', padx=5)
        ttk.Button(actions_frame, text="Oracle Help", 
                  command=self.oracle_help, style='Dark.TButton').pack(side='left', padx=5)
        ttk.Button(actions_frame, text="Settings", 
                  command=self.open_settings, style='Dark.TButton').pack(side='right')
        
        # Add welcome message
        self.add_message("Zed Desktop", "Welcome! I'm Zed, your AI assistant. I'm powered by the Zebulon system and ready to help you with any tasks.")
        
    def check_connection(self):
        """Check connection to Zebulon system"""
        def check():
            try:
                response = requests.get(f"{self.zebulon_url}/api/extension/status", timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    if data.get('zedOnline'):
                        self.is_connected = True
                        self.status_label.config(text="Connected to Zed AI")
                        return
            except:
                pass
                
            self.is_connected = False
            self.status_label.config(text="Disconnected - Check Zebulon server")
            
        threading.Thread(target=check, daemon=True).start()
        # Recheck every 30 seconds
        self.root.after(30000, self.check_connection)
        
    def add_message(self, sender, message):
        """Add message to chat display"""
        self.chat_display.config(state='normal')
        timestamp = datetime.now().strftime("%H:%M")
        
        if sender == "You":
            self.chat_display.insert(tk.END, f"[{timestamp}] You: {message}\n\n")
        else:
            self.chat_display.insert(tk.END, f"[{timestamp}] {sender}: {message}\n\n")
            
        self.chat_display.config(state='disabled')
        self.chat_display.see(tk.END)
        
    def send_message(self, event=None):
        """Send message to Zed AI"""
        message = self.message_entry.get().strip()
        if not message:
            return
            
        self.message_entry.delete(0, tk.END)
        self.add_message("You", message)
        
        if not self.is_connected:
            self.add_message("System", "Not connected to Zebulon server. Please check your connection.")
            return
            
        def send_async():
            try:
                payload = {
                    "type": "direct_chat",
                    "message": message,
                    "context": {
                        "source": "desktop_app"
                    },
                    "userId": self.user_id
                }
                
                response = requests.post(
                    f"{self.zebulon_url}/api/extension/chat",
                    json=payload,
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.root.after(0, lambda: self.add_message("Zed", data.get('message', 'No response')))
                else:
                    self.root.after(0, lambda: self.add_message("System", f"Error: {response.status_code}"))
                    
            except requests.exceptions.Timeout:
                self.root.after(0, lambda: self.add_message("System", "Request timed out. Zed might be processing a complex request."))
            except Exception as e:
                self.root.after(0, lambda: self.add_message("System", f"Connection error: {str(e)}"))
                
        threading.Thread(target=send_async, daemon=True).start()
        
    def get_system_status(self):
        """Get system status from Zed"""
        self.add_message("You", "Show system status")
        
        def get_status():
            try:
                response = requests.get(f"{self.zebulon_url}/api/system/status/comprehensive", timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    status_msg = f"Zebulon System Status:\n"
                    status_msg += f"Version: {data.get('version', 'Unknown')}\n"
                    status_msg += f"Active Capabilities: {len(data.get('capabilities', []))}\n"
                    status_msg += f"System Health: {data.get('diagnostic', {}).get('overall', 'Unknown')}"
                    
                    self.root.after(0, lambda: self.add_message("Zed", status_msg))
                else:
                    self.root.after(0, lambda: self.add_message("System", "Could not retrieve system status"))
            except Exception as e:
                self.root.after(0, lambda: self.add_message("System", f"Status check failed: {str(e)}"))
                
        threading.Thread(target=get_status, daemon=True).start()
        
    def oracle_help(self):
        """Get Oracle database help"""
        message = "I need help with Oracle database operations. What can you help me with?"
        self.message_entry.insert(0, message)
        self.send_message()
        
    def open_settings(self):
        """Open settings dialog"""
        settings_window = tk.Toplevel(self.root)
        settings_window.title("Zed Desktop Settings")
        settings_window.geometry("400x300")
        settings_window.configure(bg='#2d2d2d')
        
        # Server URL setting
        ttk.Label(settings_window, text="Zebulon Server URL:", style='Dark.TLabel').pack(pady=10)
        url_entry = tk.Entry(settings_window, bg='#1a1a1a', fg='white', font=('Arial', 10))
        url_entry.insert(0, self.zebulon_url)
        url_entry.pack(pady=5, padx=20, fill='x')
        
        # User ID setting
        ttk.Label(settings_window, text="User ID:", style='Dark.TLabel').pack(pady=10)
        user_entry = tk.Entry(settings_window, bg='#1a1a1a', fg='white', font=('Arial', 10))
        user_entry.insert(0, str(self.user_id))
        user_entry.pack(pady=5, padx=20, fill='x')
        
        def save_settings():
            self.zebulon_url = url_entry.get().strip()
            try:
                self.user_id = int(user_entry.get().strip())
            except ValueError:
                messagebox.showerror("Error", "User ID must be a number")
                return
                
            settings_window.destroy()
            self.check_connection()
            
        ttk.Button(settings_window, text="Save", command=save_settings, 
                  style='Dark.TButton').pack(pady=20)

def main():
    root = tk.Tk()
    app = ZedDesktopApp(root)
    
    # Center window on screen
    root.eval('tk::PlaceWindow . center')
    
    # Start the application
    root.mainloop()

if __name__ == "__main__":
    main()