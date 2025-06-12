/**
 * Alice Page Component
 * 
 * Dashboard interface for Alice's interactions with Selfie agents
 */

import { SelfieBaseComponent } from './base-component.js';
import type { AgentsStatusResponse, HealthResponse } from '@/types/api.js';
import type { ComponentState } from '@/types/components.js';

interface AlicePageState extends ComponentState {
  visible: boolean;
  systemHealth?: HealthResponse;
  agentStatus?: AgentsStatusResponse;
  loading: boolean;
  error?: string;
}

export class AlicePageComponent extends SelfieBaseComponent {
  static observedAttributes = ['visible'];

  private refreshInterval?: number | undefined;

  constructor() {
    super();
    this.setState({
      visible: true,
      loading: true,
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.startDataRefresh();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stopDataRefresh();
  }

  override attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === 'visible') {
      this.setState({ visible: newValue === 'true' });
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  override render(): void {
    const state = this.getState() as AlicePageState;

    if (!state.visible) {
      this.style.display = 'none';
      return;
    }

    this.style.display = 'block';
    
    const template = this.createTemplate(
      this.getHtmlTemplate(state),
      this.getCssStyles()
    );

    this.shadow.innerHTML = '';
    this.shadow.appendChild(template);
  }

  protected override attachEventListeners(): void {
    this.addEventListenerWithSelector('click', this.handleNavigation, '[data-action="navigate-to-bob"]');
    this.addEventListenerWithSelector('click', this.handleRefresh, '[data-action="refresh"]');
  }

  private getHtmlTemplate(state: AlicePageState): string {
    return `
      <div class="page" data-testid="alice-page">
        <h1>👩‍💻 Alice's Dashboard</h1>
        <p>Welcome to Alice's interface! Monitor and manage Selfie agent activities from here.</p>
        
        ${this.getStatusCardsHtml(state)}
        
        <button 
          class="nav-button" 
          data-testid="go-to-bob-button" 
          data-action="navigate-to-bob"
        >
          🚀 Switch to Bob's Coordination Center
        </button>
        
        <button 
          class="refresh-button" 
          data-action="refresh"
          ${state.loading ? 'disabled' : ''}
        >
          ${state.loading ? '⟳ Refreshing...' : '🔄 Refresh Data'}
        </button>
        
        <div class="features">
          <div class="features-grid">
            <div class="feature-section">
              <h3>Alice's Capabilities</h3>
              <ul>
                <li>📊 Monitor Selfie agent status and health</li>
                <li>🎯 Create and track development tasks</li>
                <li>🔌 View active MCP server connections</li>
                <li>📝 Manage GitHub issue integration</li>
                <li>🔍 Real-time system monitoring</li>
              </ul>
            </div>
            
            <div class="feature-section">
              <h3>💬 Chat with Alice</h3>
              <p>Ask Alice about system status, agent coordination, or development workflows.</p>
              <chat-interface agent="alice"></chat-interface>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private getStatusCardsHtml(state: AlicePageState): string {
    if (state.loading && !state.systemHealth) {
      return `
        <div class="status-card loading">
          <h4>🔄 Loading System Status</h4>
          <p><span class="loading-spinner"></span>Fetching system information...</p>
        </div>
      `;
    }

    if (state.error) {
      return `
        <div class="status-card error">
          <h4>❌ Error</h4>
          <p>${state.error}</p>
        </div>
      `;
    }

    const systemCard = this.getSystemHealthCardHtml(state.systemHealth);
    const agentCard = this.getAgentStatusCardHtml(state.agentStatus);

    return `${systemCard}${agentCard}`;
  }

  private getSystemHealthCardHtml(health?: HealthResponse): string {
    if (!health) return '';

    const statusIcon = health.status === 'healthy' ? '✅' : '⚠️';
    const statusClass = health.status === 'healthy' ? 'success' : 'warning';

    return `
      <div class="status-card ${statusClass}">
        <h4>🔗 System Health</h4>
        <p>${statusIcon} ${health.service} v${health.version} - ${health.status}</p>
        <small>Last checked: ${new Date(health.timestamp).toLocaleTimeString()}</small>
      </div>
    `;
  }

  private getAgentStatusCardHtml(agents?: AgentsStatusResponse): string {
    if (!agents) return '';

    const activeCount = agents.agents.filter(a => a.status !== 'idle' && a.status !== 'offline').length;
    const statusIcon = activeCount > 0 ? '🟢' : '🟡';

    return `
      <div class="status-card">
        <h4>🤖 Agent Status</h4>
        <p>${statusIcon} ${activeCount}/${agents.totalAgents} agents active, ${agents.activeConnections} MCP connections</p>
        <div class="agent-summary">
          ${agents.agents.map(agent => `
            <span class="agent-badge ${agent.status}">
              ${this.getAgentEmoji(agent.name)} ${agent.name}
            </span>
          `).join('')}
        </div>
        <small>Last updated: ${new Date(agents.lastUpdate).toLocaleTimeString()}</small>
      </div>
    `;
  }

  private getAgentEmoji(agentName: string): string {
    const emojis: Record<string, string> = {
      initializer: '🔍',
      developer: '👨‍💻',
      reviewer: '🔍',
      tester: '🧪',
    };
    return emojis[agentName] || '🤖';
  }

  private getCssStyles(): string {
    return `
      :host {
        display: block;
        animation: fadeIn 0.3s ease-in;
      }
      
      :host(.hidden) {
        display: none;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .page {
        font-family: inherit;
      }
      
      .nav-button, .refresh-button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 12px 24px;
        margin: 10px 5px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      }
      
      .nav-button:hover, .refresh-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
      }
      
      .refresh-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
      
      h1 {
        color: #333;
        border-bottom: 3px solid #667eea;
        padding-bottom: 15px;
        font-size: 2rem;
      }
      
      .status-card {
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        border-left: 5px solid #2196f3;
        padding: 20px;
        margin: 25px 0;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(33, 150, 243, 0.1);
        transition: all 0.3s ease;
      }
      
      .status-card.success {
        background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
        border-left-color: #4caf50;
      }
      
      .status-card.warning {
        background: linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%);
        border-left-color: #ff9800;
      }
      
      .status-card.error {
        background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
        border-left-color: #f44336;
      }
      
      .status-card.loading {
        background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
        border-left-color: #9e9e9e;
      }
      
      .status-card h4 {
        margin: 0 0 10px 0;
        color: #1976d2;
        font-size: 1.1rem;
      }
      
      .agent-summary {
        margin: 10px 0;
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }
      
      .agent-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 500;
        background: rgba(255, 255, 255, 0.8);
      }
      
      .agent-badge.monitoring {
        border: 2px solid #ffc107;
        color: #f57c00;
      }
      
      .agent-badge.available {
        border: 2px solid #4caf50;
        color: #2e7d32;
      }
      
      .agent-badge.idle, .agent-badge.offline {
        border: 2px solid #9e9e9e;
        color: #616161;
      }
      
      .loading-spinner {
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 8px;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .features {
        margin-top: 30px;
      }
      
      .features-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        align-items: start;
      }
      
      @media (max-width: 1024px) {
        .features-grid {
          grid-template-columns: 1fr;
          gap: 20px;
        }
      }
      
      .feature-section h3 {
        color: #555;
        font-size: 1.3rem;
        margin-bottom: 15px;
      }
      
      .feature-section ul {
        list-style: none;
        padding: 0;
      }
      
      .feature-section li {
        margin: 12px 0;
        padding: 12px 15px;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 4px solid #667eea;
        transition: all 0.2s ease;
      }
      
      .feature-section li:hover {
        background: #e9ecef;
        transform: translateX(5px);
      }
      
      .feature-section p {
        color: #666;
        margin-bottom: 15px;
        line-height: 1.5;
      }
      
      small {
        color: #666;
        font-size: 0.85rem;
      }
    `;
  }

  private handleNavigation = (): void => {
    this.setState({ visible: false });
    this.emit('navigate', { page: 'bob' });
    
    // Update URL
    history.pushState(null, '', '/bob');
  };

  private handleRefresh = async (): Promise<void> => {
    this.setState({ loading: true, error: undefined });
    await this.fetchData();
  };

  private startDataRefresh(): void {
    this.fetchData();
    this.refreshInterval = window.setInterval(() => {
      this.fetchData();
    }, 30000) as unknown as number; // Refresh every 30 seconds
  }

  private stopDataRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = undefined;
    }
  }

  private async fetchData(): Promise<void> {
    try {
      const [healthResponse, agentsResponse] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/agents/status'),
      ]);

      if (healthResponse.ok && agentsResponse.ok) {
        const healthData = await healthResponse.json() as { data: HealthResponse };
        const agentsData = await agentsResponse.json() as { data: AgentsStatusResponse };

        this.setState({
          systemHealth: healthData.data,
          agentStatus: agentsData.data,
          loading: false,
          error: undefined,
        });
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error) {
      this.setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }
}

// Define the custom element
customElements.define('alice-page', AlicePageComponent as unknown as CustomElementConstructor);