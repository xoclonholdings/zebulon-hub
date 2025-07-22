// Zed AI Content Script - Injects AI capabilities into web pages
class ZedAIIntegration {
  constructor() {
    this.zedWidget = null;
    this.isVisible = false;
    this.settings = {};
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    
    this.initialize();
  }

  async initialize() {
    // Get settings
    this.settings = await this.getSettings();
    
    // Create floating Zed button
    this.createFloatingButton();
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
    });

    // Add keyboard shortcuts
    this.addKeyboardShortcuts();
    
    console.log('Zed AI Integration initialized on:', window.location.href);
  }

  async getSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'get_settings' }, resolve);
    });
  }

  createFloatingButton() {
    if (!this.settings.quickAccessEnabled) return;

    const button = document.createElement('div');
    button.id = 'zed-floating-button';
    button.innerHTML = `
      <div class="zed-button-content">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        </svg>
        <span>Zed</span>
      </div>
    `;
    
    // Apply styles
    Object.assign(button.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '60px',
      height: '60px',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      border: '2px solid transparent',
      borderRadius: '50%',
      cursor: 'pointer',
      zIndex: '10000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      transition: 'all 0.3s ease',
      background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    });

    button.querySelector('.zed-button-content').style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      font-size: 10px;
      font-weight: 600;
      text-align: center;
    `;

    // Add hover effects
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
      button.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    });

    // Add click handler
    button.addEventListener('click', () => {
      this.toggleZedWidget();
    });

    // Make draggable
    this.makeDraggable(button);

    document.body.appendChild(button);
    this.floatingButton = button;
  }

  makeDraggable(element) {
    element.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      const rect = element.getBoundingClientRect();
      this.dragOffset.x = e.clientX - rect.left;
      this.dragOffset.y = e.clientY - rect.top;
      element.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      
      const x = e.clientX - this.dragOffset.x;
      const y = e.clientY - this.dragOffset.y;
      
      // Keep within viewport
      const maxX = window.innerWidth - element.offsetWidth;
      const maxY = window.innerHeight - element.offsetHeight;
      
      element.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
      element.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
      element.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      this.isDragging = false;
      element.style.cursor = 'pointer';
    });
  }

  toggleZedWidget() {
    if (this.isVisible) {
      this.hideZedWidget();
    } else {
      this.showZedWidget();
    }
  }

  showZedWidget() {
    if (this.zedWidget) {
      this.zedWidget.style.display = 'block';
      this.isVisible = true;
      return;
    }

    const widget = document.createElement('div');
    widget.id = 'zed-ai-widget';
    widget.innerHTML = `
      <div class="zed-widget-header">
        <div class="zed-widget-title">
          <div class="zed-logo">⚡</div>
          <span>Zed AI Assistant</span>
        </div>
        <div class="zed-widget-controls">
          <button class="zed-minimize" title="Minimize">−</button>
          <button class="zed-close" title="Close">×</button>
        </div>
      </div>
      <div class="zed-widget-body">
        <div class="zed-chat-container">
          <div class="zed-messages" id="zed-messages"></div>
          <div class="zed-input-container">
            <input type="text" id="zed-input" placeholder="Ask Zed anything..." />
            <button id="zed-send">Send</button>
          </div>
        </div>
        <div class="zed-quick-actions">
          <button class="zed-action-btn" data-action="explain-page">Explain Page</button>
          <button class="zed-action-btn" data-action="summarize">Summarize</button>
          <button class="zed-action-btn" data-action="oracle-help">Oracle Help</button>
        </div>
      </div>
    `;

    // Apply styles
    this.applyWidgetStyles(widget);
    
    // Add event listeners
    this.addWidgetEventListeners(widget);
    
    document.body.appendChild(widget);
    this.zedWidget = widget;
    this.isVisible = true;

    // Focus input
    setTimeout(() => {
      document.getElementById('zed-input').focus();
    }, 100);
  }

  applyWidgetStyles(widget) {
    widget.style.cssText = `
      position: fixed;
      top: 50%;
      right: 20px;
      transform: translateY(-50%);
      width: 400px;
      height: 500px;
      background: rgba(0, 0, 0, 0.95);
      border: 1px solid rgba(255, 107, 107, 0.3);
      border-radius: 12px;
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(10px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;

    // Inject CSS for widget components
    const style = document.createElement('style');
    style.textContent = `
      #zed-ai-widget .zed-widget-header {
        background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
        color: white;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: move;
      }

      #zed-ai-widget .zed-widget-title {
        display: flex;
        align-items: center;
        font-weight: 600;
        font-size: 14px;
      }

      #zed-ai-widget .zed-logo {
        margin-right: 8px;
        font-size: 16px;
      }

      #zed-ai-widget .zed-widget-controls button {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        margin-left: 8px;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      #zed-ai-widget .zed-widget-controls button:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      #zed-ai-widget .zed-widget-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 16px;
      }

      #zed-ai-widget .zed-chat-container {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      #zed-ai-widget .zed-messages {
        flex: 1;
        overflow-y: auto;
        margin-bottom: 16px;
        color: white;
        font-size: 14px;
      }

      #zed-ai-widget .zed-message {
        margin-bottom: 12px;
        padding: 8px 12px;
        border-radius: 8px;
        max-width: 85%;
      }

      #zed-ai-widget .zed-message.user {
        background: rgba(255, 107, 107, 0.2);
        margin-left: auto;
        text-align: right;
      }

      #zed-ai-widget .zed-message.zed {
        background: rgba(78, 205, 196, 0.2);
      }

      #zed-ai-widget .zed-input-container {
        display: flex;
        gap: 8px;
      }

      #zed-ai-widget #zed-input {
        flex: 1;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        padding: 8px 12px;
        color: white;
        font-size: 14px;
      }

      #zed-ai-widget #zed-input::placeholder {
        color: rgba(255, 255, 255, 0.6);
      }

      #zed-ai-widget #zed-send {
        background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
        border: none;
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
      }

      #zed-ai-widget .zed-quick-actions {
        margin-top: 16px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      #zed-ai-widget .zed-action-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s ease;
      }

      #zed-ai-widget .zed-action-btn:hover {
        background: rgba(255, 107, 107, 0.2);
        border-color: rgba(255, 107, 107, 0.4);
      }
    `;
    document.head.appendChild(style);
  }

  addWidgetEventListeners(widget) {
    // Close button
    widget.querySelector('.zed-close').addEventListener('click', () => {
      this.hideZedWidget();
    });

    // Minimize button
    widget.querySelector('.zed-minimize').addEventListener('click', () => {
      this.hideZedWidget();
    });

    // Send message
    const input = widget.querySelector('#zed-input');
    const sendBtn = widget.querySelector('#zed-send');
    
    const sendMessage = () => {
      const message = input.value.trim();
      if (message) {
        this.sendMessageToZed(message);
        input.value = '';
      }
    };

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });

    // Quick actions
    widget.querySelectorAll('.zed-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handleQuickAction(e.target.dataset.action);
      });
    });

    // Make draggable by header
    this.makeDraggable(widget, widget.querySelector('.zed-widget-header'));
  }

  hideZedWidget() {
    if (this.zedWidget) {
      this.zedWidget.style.display = 'none';
      this.isVisible = false;
    }
  }

  async sendMessageToZed(message) {
    this.addMessageToChat(message, 'user');
    
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'send_to_zed',
          data: {
            type: 'chat',
            message: message,
            context: 'browser_extension',
            pageUrl: window.location.href,
            pageTitle: document.title
          }
        }, (response) => {
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error));
          }
        });
      });

      this.addMessageToChat(response.message || response.content || 'Response received', 'zed');
    } catch (error) {
      this.addMessageToChat(`Error: ${error.message}`, 'zed');
    }
  }

  addMessageToChat(message, sender) {
    const messagesContainer = document.getElementById('zed-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `zed-message ${sender}`;
    messageDiv.textContent = message;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  async handleQuickAction(action) {
    switch (action) {
      case 'explain-page':
        this.sendMessageToZed(`Please explain this page: ${document.title}`);
        break;
      case 'summarize':
        const content = document.body.innerText.substring(0, 1000);
        this.sendMessageToZed(`Please summarize this content: ${content}`);
        break;
      case 'oracle-help':
        this.sendMessageToZed('I need help with Oracle database queries. Can you assist me?');
        break;
    }
  }

  addKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+Z to toggle Zed widget
      if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        this.toggleZedWidget();
      }
      
      // Ctrl+Shift+X to analyze selected text
      if (e.ctrlKey && e.shiftKey && e.key === 'X') {
        e.preventDefault();
        const selectedText = window.getSelection().toString();
        if (selectedText) {
          this.showZedWidget();
          setTimeout(() => {
            this.sendMessageToZed(`Analyze this text: "${selectedText}"`);
          }, 500);
        }
      }
    });
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'show_zed_widget':
        this.showZedWidget();
        break;
        
      case 'show_zed_result':
        this.showZedWidget();
        setTimeout(() => {
          this.addMessageToChat(message.data.content || message.data.message, 'zed');
        }, 500);
        break;
        
      case 'show_oracle_query':
        this.showZedWidget();
        setTimeout(() => {
          this.addMessageToChat(`Oracle Query: ${message.data.query}`, 'zed');
        }, 500);
        break;
        
      case 'zed_ready':
        this.settings = message.settings;
        break;
    }
  }
}

// Initialize Zed AI Integration
new ZedAIIntegration();