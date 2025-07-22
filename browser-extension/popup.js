// Zed AI Extension Popup Script
class ZedPopup {
  constructor() {
    this.settings = {};
    this.isConnected = false;
    this.initialize();
  }

  async initialize() {
    // Load settings
    await this.loadSettings();
    
    // Check connection
    await this.checkConnection();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Auto-focus input
    document.getElementById('message-input').focus();
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'get_settings' }, (settings) => {
        this.settings = settings || {};
        resolve();
      });
    });
  }

  async checkConnection() {
    try {
      const response = await this.sendToZed({
        type: 'ping',
        source: 'extension_popup'
      });
      
      this.updateConnectionStatus(true);
    } catch (error) {
      this.updateConnectionStatus(false);
    }
  }

  updateConnectionStatus(connected) {
    this.isConnected = connected;
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    
    if (connected) {
      statusDot.className = 'status-dot online';
      statusText.textContent = 'Connected to Zed AI';
    } else {
      statusDot.className = 'status-dot offline';
      statusText.textContent = 'Disconnected - Check Zebulon server';
    }
  }

  setupEventListeners() {
    // Send message button
    document.getElementById('send-message').addEventListener('click', () => {
      this.sendMessage();
    });

    // Enter key in input
    document.getElementById('message-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });

    // Quick action buttons
    document.getElementById('explain-page').addEventListener('click', () => {
      this.handleQuickAction('explain-page');
    });

    document.getElementById('summarize').addEventListener('click', () => {
      this.handleQuickAction('summarize');
    });

    document.getElementById('oracle-help').addEventListener('click', () => {
      this.handleQuickAction('oracle-help');
    });

    document.getElementById('analyze-text').addEventListener('click', () => {
      this.handleQuickAction('analyze-text');
    });

    // Settings link
    document.getElementById('open-settings').addEventListener('click', (e) => {
      e.preventDefault();
      this.openSettings();
    });
  }

  async sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    input.value = '';
    input.disabled = true;
    
    try {
      // Get current tab info
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const response = await this.sendToZed({
        type: 'direct_chat',
        message: message,
        context: {
          source: 'extension_popup',
          pageUrl: tab.url,
          pageTitle: tab.title
        }
      });

      // Show response in current tab or new window
      await this.showZedResponse(response, tab.id);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      this.showError('Failed to reach Zed AI. Check connection.');
    } finally {
      input.disabled = false;
      input.focus();
    }
  }

  async handleQuickAction(action) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      let message = '';
      let needsPageContent = false;
      
      switch (action) {
        case 'explain-page':
          message = `Zed, please explain this webpage: "${tab.title}"`;
          needsPageContent = true;
          break;
        case 'summarize':
          message = 'Zed, please summarize the content of this page';
          needsPageContent = true;
          break;
        case 'oracle-help':
          message = 'Zed, I need help with Oracle database operations. What can you assist me with?';
          break;
        case 'analyze-text':
          message = 'Zed, please analyze any selected text on this page';
          needsPageContent = true;
          break;
      }

      let context = {
        source: 'extension_popup',
        action: action,
        pageUrl: tab.url,
        pageTitle: tab.title
      };

      if (needsPageContent) {
        // Get page content and selection
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: () => {
            const selection = window.getSelection().toString();
            const content = document.body.innerText.substring(0, 2000);
            return { selection, content };
          }
        });
        
        context.pageContent = result.result.content;
        context.selectedText = result.result.selection;
        
        if (action === 'analyze-text' && result.result.selection) {
          message += `: "${result.result.selection}"`;
        }
      }

      const response = await this.sendToZed({
        type: 'quick_action',
        message: message,
        context: context
      });

      await this.showZedResponse(response, tab.id);
      
    } catch (error) {
      console.error('Quick action failed:', error);
      this.showError('Action failed. Check connection to Zed.');
    }
  }

  async sendToZed(data) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'send_to_zed',
        data: data
      }, (response) => {
        if (response && response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || 'Communication failed'));
        }
      });
    });
  }

  async showZedResponse(response, tabId) {
    // Send response to content script to display
    chrome.tabs.sendMessage(tabId, {
      type: 'show_zed_response',
      data: response,
      source: 'popup'
    });
  }

  showError(message) {
    // Simple error display in popup
    const statusText = document.getElementById('status-text');
    const originalText = statusText.textContent;
    
    statusText.textContent = message;
    statusText.style.color = '#ff6b6b';
    
    setTimeout(() => {
      statusText.textContent = originalText;
      statusText.style.color = '';
    }, 3000);
  }

  openSettings() {
    // Open options page
    chrome.runtime.openOptionsPage();
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ZedPopup();
});