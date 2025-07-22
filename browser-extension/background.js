// Zed AI Browser Extension Background Script
let zedConnection = null;
let activeTabId = null;
let zedServerUrl = 'http://localhost:5000'; // Default to local development

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.sync.set({
      zedEnabled: true,
      serverUrl: zedServerUrl,
      autoConnect: true,
      userId: 1,
      quickAccessEnabled: true,
      contextMenuEnabled: true
    });

    // Create context menu items
    createContextMenus();
  }
});

// Create context menu items
function createContextMenus() {
  chrome.contextMenus.create({
    id: 'zed-analyze-text',
    title: 'Ask Zed about this text',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'zed-explain-page',
    title: 'Ask Zed to explain this page',
    contexts: ['page']
  });

  chrome.contextMenus.create({
    id: 'zed-oracle-query',
    title: 'Convert to Oracle query',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'zed-quick-chat',
    title: 'Quick chat with Zed',
    contexts: ['page']
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'zed-analyze-text':
      handleTextAnalysis(info.selectionText, tab.id);
      break;
    case 'zed-explain-page':
      handlePageExplanation(tab, tab.id);
      break;
    case 'zed-oracle-query':
      handleOracleQuery(info.selectionText, tab.id);
      break;
    case 'zed-quick-chat':
      showZedWidget(tab.id);
      break;
  }
});

// Handle text analysis
async function handleTextAnalysis(text, tabId) {
  try {
    const response = await sendToZed({
      type: 'analyze_text',
      content: text,
      context: 'browser_extension'
    });

    // Show result in overlay
    chrome.tabs.sendMessage(tabId, {
      type: 'show_zed_result',
      data: response,
      title: 'Zed Analysis'
    });
  } catch (error) {
    console.error('Failed to analyze text:', error);
    showErrorNotification('Failed to connect to Zed AI');
  }
}

// Handle page explanation
async function handlePageExplanation(tab, tabId) {
  try {
    // Get page content
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: () => {
        return {
          title: document.title,
          url: window.location.href,
          content: document.body.innerText.substring(0, 2000) // Limit content
        };
      }
    });

    const response = await sendToZed({
      type: 'explain_page',
      pageData: result.result,
      context: 'browser_extension'
    });

    chrome.tabs.sendMessage(tabId, {
      type: 'show_zed_result',
      data: response,
      title: 'Page Explanation'
    });
  } catch (error) {
    console.error('Failed to explain page:', error);
    showErrorNotification('Failed to analyze page');
  }
}

// Handle Oracle query conversion
async function handleOracleQuery(text, tabId) {
  try {
    const response = await sendToZed({
      type: 'convert_to_oracle',
      naturalLanguage: text,
      context: 'browser_extension'
    });

    chrome.tabs.sendMessage(tabId, {
      type: 'show_oracle_query',
      data: response,
      originalText: text
    });
  } catch (error) {
    console.error('Failed to convert to Oracle query:', error);
    showErrorNotification('Failed to convert to Oracle query');
  }
}

// Show Zed widget
function showZedWidget(tabId) {
  chrome.tabs.sendMessage(tabId, {
    type: 'show_zed_widget'
  });
}

// Send message to Zed AI
async function sendToZed(data) {
  const settings = await chrome.storage.sync.get(['serverUrl', 'userId']);
  const serverUrl = settings.serverUrl || zedServerUrl;
  const userId = settings.userId || 1;

  const response = await fetch(`${serverUrl}/api/extension/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...data,
      userId: userId,
      timestamp: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error(`Server responded with ${response.status}`);
  }

  return await response.json();
}

// Show error notification
function showErrorNotification(message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon-48.png',
    title: 'Zed AI Extension',
    message: message
  });
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Show the popup or widget based on settings
  showZedWidget(tab.id);
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'send_to_zed':
      sendToZed(message.data)
        .then(response => sendResponse({ success: true, data: response }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response
    
    case 'get_settings':
      chrome.storage.sync.get(null)
        .then(settings => sendResponse(settings));
      return true;
    
    case 'save_settings':
      chrome.storage.sync.set(message.settings)
        .then(() => sendResponse({ success: true }));
      return true;
  }
});

// Tab management
chrome.tabs.onActivated.addListener((activeInfo) => {
  activeTabId = activeInfo.tabId;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    // Page loaded, can inject Zed capabilities if enabled
    checkAndInjectZed(tabId);
  }
});

// Check if Zed should be injected
async function checkAndInjectZed(tabId) {
  const settings = await chrome.storage.sync.get(['zedEnabled', 'autoConnect']);
  
  if (settings.zedEnabled && settings.autoConnect) {
    try {
      chrome.tabs.sendMessage(tabId, {
        type: 'zed_ready',
        settings: settings
      });
    } catch (error) {
      // Tab might not have content script loaded yet
      console.log('Could not send ready message to tab:', tabId);
    }
  }
}