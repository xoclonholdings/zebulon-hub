# Zed AI iOS Shortcuts Integration

These iOS Shortcuts allow you to integrate Zed AI into your iPhone and iPad workflows through the Zebulon system.

## Installation Instructions

1. Open the Shortcuts app on your iOS device
2. Tap "+" to create a new shortcut
3. Follow the setup instructions for each shortcut below
4. Configure your Zebulon server URL in the shortcuts

## Available Shortcuts

### 1. Ask Zed
**Purpose**: Send any text question to Zed AI
**Setup**:
- Add "Text" action for input
- Add "Get Contents of URL" action:
  - URL: `[YOUR_ZEBULON_URL]/api/extension/chat`
  - Method: POST
  - Request Body: JSON
  ```json
  {
    "type": "direct_chat",
    "message": "[Text Input]",
    "context": {
      "source": "ios_shortcut"
    },
    "userId": 1
  }
  ```
- Add "Get Value from Dictionary" to extract "message"
- Add "Speak Text" or "Show Result" to display response

### 2. Zed Oracle Query
**Purpose**: Convert natural language to Oracle SQL queries
**Setup**:
- Add "Text" action for input
- Add "Get Contents of URL" action:
  - URL: `[YOUR_ZEBULON_URL]/api/extension/chat`
  - Method: POST
  - Request Body: JSON
  ```json
  {
    "type": "convert_to_oracle",
    "naturalLanguage": "[Text Input]",
    "context": {
      "source": "ios_shortcut",
      "action": "oracle_conversion"
    },
    "userId": 1
  }
  ```
- Add "Get Value from Dictionary" to extract "message"
- Add "Copy to Clipboard" and "Show Result"

### 3. Zed Voice Assistant
**Purpose**: Voice interaction with Zed AI
**Setup**:
- Add "Dictate Text" action
- Add "Get Contents of URL" action with the dictated text
- Configure same as "Ask Zed" but use dictated input
- Add "Speak Text" for audio response

### 4. Zed System Status
**Purpose**: Check Zebulon system status
**Setup**:
- Add "Get Contents of URL" action:
  - URL: `[YOUR_ZEBULON_URL]/api/extension/status`
  - Method: GET
- Add "Get Value from Dictionary" actions to format status
- Add "Show Result" with formatted system information

### 5. Zed Quick Actions
**Purpose**: Quick access to common Zed tasks
**Setup**:
- Add "Choose from Menu" action with options:
  - "System Status"
  - "Oracle Help" 
  - "Voice Chat"
  - "Text Analysis"
- Use "If" conditions to handle each menu choice
- Connect to appropriate Zed endpoints

## Configuration

### Setting Up Your Server URL
1. In each shortcut, find the "Get Contents of URL" action
2. Replace `[YOUR_ZEBULON_URL]` with your actual server:
   - Local: `http://YOUR_IP:5000`
   - Replit: `https://YOUR_REPL_URL.repl.dev`
   - Custom domain: `https://your-domain.com`

### Authentication
If your Zebulon system has authentication enabled:
1. Add "Text" action with your API key
2. Add "Set Variable" to store the key
3. In "Get Contents of URL", add Headers:
   - `Authorization: Bearer [Your API Key]`

## Advanced Features

### Siri Integration
1. In any shortcut, tap the settings icon
2. Enable "Use with Siri"
3. Record your phrase (e.g., "Ask Zed", "Oracle Query")
4. Test with "Hey Siri, [your phrase]"

### Widget Integration
1. Add shortcuts to your home screen widget
2. Create automation triggers for specific times
3. Use with Focus modes for context-aware assistance

### Share Sheet Integration
1. Enable "Show in Share Sheet" for text analysis shortcuts
2. Select content in any app → Share → Run Shortcut
3. Zed will analyze the shared content

## Example Usage Scenarios

1. **Quick Oracle Queries**: "Hey Siri, Oracle Query" → "Show me all customers from California"
2. **Voice Assistant**: "Hey Siri, Ask Zed" → "What's the weather like today?"
3. **System Monitoring**: Add widget to check Zebulon system status
4. **Content Analysis**: Select text in Safari → Share → Zed Analysis

## Troubleshooting

- **Connection Issues**: Verify your Zebulon server URL and network connection
- **Permission Errors**: Check user permissions in Zebulon admin panel
- **Timeout Errors**: Increase timeout in "Get Contents of URL" action
- **Voice Not Working**: Check iOS speech recognition permissions

## Security Notes

- Use HTTPS for production Zebulon servers
- Store API keys securely in Shortcuts
- Enable admin approval for sensitive operations
- Regularly update shortcuts when Zebulon system updates