/**
 * Chat Interface Component
 * 
 * Reusable chat interface for Alice and Bob agents
 */

import { SelfieBaseComponent } from './base-component.js';
import type { ComponentState } from '@/types/components.js';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceState extends ComponentState {
  messages: ChatMessage[];
  isLoading: boolean;
  error?: string;
  agent: 'alice' | 'bob';
}

export class ChatInterfaceComponent extends SelfieBaseComponent {
  static observedAttributes = ['agent'];

  constructor() {
    super();
    this.setState({
      messages: [],
      isLoading: false,
      agent: 'alice',
    });
  }

  override attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === 'agent' && newValue && oldValue !== newValue) {
      this.setState({ 
        agent: newValue as 'alice' | 'bob',
        messages: [], // Clear messages when agent changes
      });
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  override render(): void {
    const state = this.getState() as ChatInterfaceState;
    
    const template = this.createTemplate(
      this.getHtmlTemplate(state),
      this.getCssStyles()
    );

    this.shadow.innerHTML = '';
    this.shadow.appendChild(template);
    
    // Focus on input after render
    setTimeout(() => {
      const input = this.shadow.querySelector('#message-input') as HTMLTextAreaElement;
      if (input) {
        input.focus();
      }
    }, 0);
  }

  protected override attachEventListeners(): void {
    this.addEventListenerWithSelector('click', this.handleSendMessage, '#send-button');
    this.addEventListenerWithSelector('keydown', this.handleKeyDown, '#message-input');
    this.addEventListenerWithSelector('click', this.handleClearChat, '#clear-button');
  }

  private getHtmlTemplate(state: ChatInterfaceState): string {
    const agentEmoji = state.agent === 'alice' ? '👩‍💻' : '🧠';
    const agentName = state.agent === 'alice' ? 'Alice' : 'Bob';

    return `
      <div class="chat-interface">
        <div class="chat-header">
          <h3>${agentEmoji} Chat with ${agentName}</h3>
          <button id="clear-button" class="clear-button" title="Clear chat history">
            🗑️ Clear
          </button>
        </div>
        
        <div class="chat-messages" id="chat-messages">
          ${state.messages.length === 0 ? this.getWelcomeMessage(state.agent) : ''}
          ${state.messages.map(msg => this.getMessageHtml(msg)).join('')}
          ${state.isLoading ? this.getLoadingMessage() : ''}
          ${state.error ? this.getErrorMessage(state.error) : ''}
        </div>
        
        <div class="chat-input">
          <div class="input-container">
            <textarea
              id="message-input"
              placeholder="Ask ${agentName} a question or request help..."
              rows="2"
              ${state.isLoading ? 'disabled' : ''}
            ></textarea>
            <button 
              id="send-button" 
              class="send-button"
              ${state.isLoading ? 'disabled' : ''}
            >
              ${state.isLoading ? '⏳' : '📤'}
            </button>
          </div>
          <div class="input-hint">
            Press Ctrl+Enter to send • ${agentName} is powered by Llama 3.3 70B
          </div>
        </div>
      </div>
    `;
  }

  private getWelcomeMessage(agent: 'alice' | 'bob'): string {
    const welcomeMessages = {
      alice: `
        <div class="message assistant">
          <div class="message-avatar">👩‍💻</div>
          <div class="message-content">
            <div class="message-text">
              Hi! I'm Alice, your Selfie system monitor. I can help you with:
              <ul>
                <li>🔍 Monitoring agent status and system health</li>
                <li>📋 Creating and tracking development tasks</li>
                <li>🔗 Managing GitHub issue integration</li>
                <li>💡 Explaining how Selfie agents work</li>
              </ul>
              What would you like to know?
            </div>
          </div>
        </div>
      `,
      bob: `
        <div class="message assistant">
          <div class="message-avatar">🧠</div>
          <div class="message-content">
            <div class="message-text">
              Hello! I'm Bob, your coordination center manager. I can assist with:
              <ul>
                <li>🎛️ Orchestrating multiple Selfie instances</li>
                <li>📊 Managing development workflows and priorities</li>
                <li>🔄 Coordinating pull request reviews</li>
                <li>🌐 Overseeing MCP server protocols</li>
              </ul>
              How can I help coordinate your development process?
            </div>
          </div>
        </div>
      `,
    };

    return welcomeMessages[agent];
  }

  private getMessageHtml(message: ChatMessage): string {
    const isUser = message.role === 'user';
    const avatar = isUser ? '👤' : (this.getState().agent === 'alice' ? '👩‍💻' : '🧠');
    
    return `
      <div class="message ${message.role}">
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
          <div class="message-text">${this.formatMessageText(message.content)}</div>
          <div class="message-time">${this.formatTime(message.timestamp)}</div>
        </div>
      </div>
    `;
  }

  private getLoadingMessage(): string {
    const agent = this.getState().agent;
    const avatar = agent === 'alice' ? '👩‍💻' : '🧠';
    
    return `
      <div class="message assistant loading">
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
          <div class="message-text">
            <span class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </span>
            ${agent === 'alice' ? 'Alice' : 'Bob'} is thinking...
          </div>
        </div>
      </div>
    `;
  }

  private getErrorMessage(error: string): string {
    return `
      <div class="message error">
        <div class="message-avatar">❌</div>
        <div class="message-content">
          <div class="message-text">
            <strong>Error:</strong> ${error}
          </div>
        </div>
      </div>
    `;
  }

  private formatMessageText(text: string): string {
    // Convert URLs to links
    text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    
    // Convert newlines to <br>
    text = text.replace(/\n/g, '<br>');
    
    // Simple markdown-like formatting
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/`(.*?)`/g, '<code>$1</code>');
    
    return text;
  }

  private formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  private getCssStyles(): string {
    return `
      :host {
        display: block;
        height: 100%;
      }
      
      .chat-interface {
        display: flex;
        flex-direction: column;
        height: 500px;
        border: 1px solid #dee2e6;
        border-radius: 12px;
        background: #fff;
        overflow: hidden;
      }
      
      .chat-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .chat-header h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
      }
      
      .clear-button {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: background-color 0.2s;
      }
      
      .clear-button:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      
      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 15px;
        background: #f8f9fa;
      }
      
      .message {
        display: flex;
        margin-bottom: 15px;
        animation: fadeInUp 0.3s ease-out;
      }
      
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .message.user {
        justify-content: flex-end;
      }
      
      .message.user .message-content {
        background: #667eea;
        color: white;
        margin-left: 50px;
      }
      
      .message.assistant .message-content {
        background: white;
        color: #333;
        margin-right: 50px;
        border: 1px solid #e9ecef;
      }
      
      .message.error .message-content {
        background: #ffe6e6;
        color: #d32f2f;
        border: 1px solid #ffcdd2;
        margin-right: 50px;
      }
      
      .message-avatar {
        width: 35px;
        height: 35px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        background: #f0f0f0;
        margin: 0 10px;
        flex-shrink: 0;
      }
      
      .message.user .message-avatar {
        order: 2;
      }
      
      .message-content {
        max-width: 70%;
        padding: 12px 15px;
        border-radius: 12px;
        position: relative;
      }
      
      .message-text {
        line-height: 1.4;
        margin-bottom: 5px;
      }
      
      .message-text ul {
        margin: 8px 0;
        padding-left: 20px;
      }
      
      .message-text li {
        margin: 4px 0;
      }
      
      .message-text code {
        background: rgba(0, 0, 0, 0.1);
        padding: 2px 4px;
        border-radius: 3px;
        font-family: monospace;
        font-size: 0.9em;
      }
      
      .message-text a {
        color: inherit;
        text-decoration: underline;
      }
      
      .message-time {
        font-size: 0.75rem;
        opacity: 0.7;
        text-align: right;
      }
      
      .message.user .message-time {
        color: rgba(255, 255, 255, 0.8);
      }
      
      .typing-indicator {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        margin-right: 8px;
      }
      
      .typing-indicator span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #667eea;
        animation: typing 1.4s infinite ease-in-out;
      }
      
      .typing-indicator span:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      .typing-indicator span:nth-child(3) {
        animation-delay: 0.4s;
      }
      
      @keyframes typing {
        0%, 60%, 100% {
          transform: translateY(0);
          opacity: 0.4;
        }
        30% {
          transform: translateY(-10px);
          opacity: 1;
        }
      }
      
      .chat-input {
        padding: 15px;
        background: white;
        border-top: 1px solid #dee2e6;
      }
      
      .input-container {
        display: flex;
        gap: 10px;
        align-items: flex-end;
      }
      
      #message-input {
        flex: 1;
        padding: 10px 12px;
        border: 1px solid #ced4da;
        border-radius: 8px;
        resize: vertical;
        min-height: 20px;
        max-height: 100px;
        font-family: inherit;
        font-size: 14px;
        line-height: 1.4;
        outline: none;
        transition: border-color 0.2s;
      }
      
      #message-input:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
      }
      
      #message-input:disabled {
        background: #f8f9fa;
        color: #6c757d;
        cursor: not-allowed;
      }
      
      .send-button {
        background: #667eea;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        transition: background-color 0.2s;
        min-width: 45px;
        height: 41px;
      }
      
      .send-button:hover:not(:disabled) {
        background: #5a6fd8;
      }
      
      .send-button:disabled {
        background: #adb5bd;
        cursor: not-allowed;
      }
      
      .input-hint {
        font-size: 0.75rem;
        color: #6c757d;
        margin-top: 8px;
        text-align: center;
      }
      
      /* Scrollbar styling */
      .chat-messages::-webkit-scrollbar {
        width: 6px;
      }
      
      .chat-messages::-webkit-scrollbar-track {
        background: #f1f1f1;
      }
      
      .chat-messages::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
      }
      
      .chat-messages::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
    `;
  }

  private handleSendMessage = async (): Promise<void> => {
    const input = this.shadow.querySelector('#message-input') as HTMLTextAreaElement;
    const message = input.value.trim();
    
    if (!message || this.getState().isLoading) return;

    // Add user message
    this.addMessage('user', message);
    input.value = '';
    
    // Set loading state
    this.setState({ isLoading: true, error: undefined });

    try {
      const response = await this.sendChatMessage(message);
      this.addMessage('assistant', response);
    } catch (error) {
      this.setState({ 
        error: error instanceof Error ? error.message : 'Failed to send message'
      });
    } finally {
      this.setState({ isLoading: false });
    }
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.handleSendMessage();
    }
  };

  private handleClearChat = (): void => {
    this.setState({ 
      messages: [],
      error: undefined 
    });
  };

  private addMessage(role: 'user' | 'assistant', content: string): void {
    const state = this.getState() as ChatInterfaceState;
    const newMessage: ChatMessage = {
      role,
      content,
      timestamp: new Date(),
    };
    
    this.setState({
      messages: [...state.messages, newMessage]
    });

    // Scroll to bottom
    setTimeout(() => {
      const messagesContainer = this.shadow.querySelector('.chat-messages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 0);
  }

  private async sendChatMessage(message: string): Promise<string> {
    const state = this.getState() as ChatInterfaceState;
    
    const response = await fetch('/api/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          ...state.messages.map(msg => ({ role: msg.role, content: msg.content })),
          { role: 'user', content: message }
        ],
        agent: state.agent,
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.status}`);
    }

    const data = await response.json() as any;
    
    if (!data.success) {
      throw new Error(data.error || 'Unknown error');
    }

    return data.data.choices[0]?.message?.content || 'No response';
  }
}

// Define the custom element
customElements.define('chat-interface', ChatInterfaceComponent as unknown as CustomElementConstructor);