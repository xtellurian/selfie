/**
 * Bob Page Component
 * 
 * Coordination center interface for managing multiple Selfie agents
 */

import { SelfieBaseComponent } from './base-component.js';
import type { AgentsStatusResponse, AgentStatus } from '@/types/api.js';
import type { AgentCardData } from '@/types/components.js';

interface BobPageState {
  visible: boolean;
  agentStatus?: AgentsStatusResponse;
  loading: boolean;
  error?: string;
  selectedAgent?: string;
}

export class BobPageComponent extends SelfieBaseComponent {
  static observedAttributes = ['visible'];

  private refreshInterval?: number;

  constructor() {
    super();
    this.setState({
      visible: false,
      loading: true,
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.startDataRefresh();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stopDataRefresh();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === 'visible') {
      this.setState({ visible: newValue === 'true' });
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  render(): void {
    const state = this.getState() as BobPageState;

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

  protected attachEventListeners(): void {
    this.addEventListener('click', this.handleNavigation, '[data-action="navigate-to-alice"]');
    this.addEventListener('click', this.handleRefresh, '[data-action="refresh"]');
    this.addEventListener('click', this.handleAgentSelect, '[data-agent-name]');
  }

  private getHtmlTemplate(state: BobPageState): string {
    return `
      <div class="page" data-testid="bob-page">
        <h1>🧠 Bob's Coordination Center</h1>
        <p>Orchestrate and monitor the entire Selfie ecosystem from this central command interface.</p>
        
        ${this.getCoordinationPanelHtml(state)}
        
        <div class="action-buttons">
          <button 
            class="nav-button" 
            data-testid="go-to-alice-button" 
            data-action="navigate-to-alice"
          >
            👩‍💻 Switch to Alice's Dashboard
          </button>
          
          <button 
            class="refresh-button" 
            data-action="refresh"
            ${state.loading ? 'disabled' : ''}
          >
            ${state.loading ? '⟳ Refreshing...' : '🔄 Refresh Agents'}
          </button>
        </div>
        
        <div class="features">
          <h3>Bob's Control Systems</h3>
          <ul>
            <li>🎛️ Coordinate multiple Selfie instances across networks</li>
            <li>📋 Review and approve automated pull requests</li>
            <li>📊 Monitor development task queues and priorities</li>
            <li>🔄 Manage system health and performance metrics</li>
            <li>🌐 Oversee MCP server coordination protocols</li>
          </ul>
        </div>
      </div>
    `;
  }

  private getCoordinationPanelHtml(state: BobPageState): string {
    if (state.loading && !state.agentStatus) {
      return `
        <div class="coordination-panel">
          <h4>🤖 Agent Coordination Dashboard</h4>
          <div class="loading-state">
            <span class="loading-spinner"></span>
            <p>Loading agent information...</p>
          </div>
        </div>
      `;
    }

    if (state.error) {
      return `
        <div class="coordination-panel error">
          <h4>❌ Coordination Error</h4>
          <p>${state.error}</p>
        </div>
      `;
    }

    if (!state.agentStatus) {
      return `
        <div class="coordination-panel">
          <h4>🤖 Agent Coordination Dashboard</h4>
          <p>No agent data available.</p>
        </div>
      `;
    }

    return `
      <div class="coordination-panel">
        <h4>🤖 Agent Coordination Dashboard</h4>
        <div class="coordination-summary">
          <div class="summary-stat">
            <span class="stat-number">${state.agentStatus.totalAgents}</span>
            <span class="stat-label">Total Agents</span>
          </div>
          <div class="summary-stat">
            <span class="stat-number">${state.agentStatus.activeConnections}</span>
            <span class="stat-label">Active Connections</span>
          </div>
          <div class="summary-stat">
            <span class="stat-number">${this.getActiveAgentCount(state.agentStatus.agents)}</span>
            <span class="stat-label">Working Agents</span>
          </div>
        </div>
        
        <div class="agent-grid">
          ${state.agentStatus.agents.map(agent => this.getAgentCardHtml(agent, state.selectedAgent)).join('')}
        </div>
        
        <small>Last updated: ${new Date(state.agentStatus.lastUpdate).toLocaleTimeString()}</small>
      </div>
    `;
  }

  private getAgentCardHtml(agent: AgentStatus, selectedAgent?: string): string {
    const isSelected = selectedAgent === agent.name;
    const statusIcon = this.getStatusIcon(agent.status);
    const agentEmoji = this.getAgentEmoji(agent.name);

    return `
      <div 
        class="agent-card ${agent.status} ${isSelected ? 'selected' : ''}"
        data-agent-name="${agent.name}"
        role="button"
        tabindex="0"
      >
        <div class="agent-header">
          <strong>${agentEmoji} ${this.capitalize(agent.name)} Agent</strong>
          <span class="status-indicator">
            <span class="status-icon">${statusIcon}</span>
            ${this.capitalize(agent.status)}
          </span>
        </div>
        
        <div class="agent-details">
          <p><strong>Last Seen:</strong> ${this.formatRelativeTime(agent.lastSeen)}</p>
          
          ${agent.currentTask ? `
            <p><strong>Current Task:</strong> ${agent.currentTask}</p>
          ` : ''}
          
          ${agent.capabilities ? `
            <div class="capabilities">
              <strong>Capabilities:</strong>
              ${agent.capabilities.map(cap => `<span class="capability-tag">${cap}</span>`).join('')}
            </div>
          ` : ''}
          
          ${agent.metadata ? this.getMetadataHtml(agent.metadata) : ''}
        </div>
      </div>
    `;
  }

  private getMetadataHtml(metadata: Record<string, unknown>): string {
    const relevantKeys = Object.keys(metadata).slice(0, 3); // Show up to 3 metadata items
    
    if (relevantKeys.length === 0) return '';

    return `
      <div class="metadata">
        ${relevantKeys.map(key => `
          <div class="metadata-item">
            <span class="metadata-key">${this.formatMetadataKey(key)}:</span>
            <span class="metadata-value">${this.formatMetadataValue(metadata[key])}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  private getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      monitoring: '🟡',
      available: '🟢',
      busy: '🔴',
      idle: '⚪',
      offline: '⚫',
    };
    return icons[status] || '❓';
  }

  private getAgentEmoji(agentName: string): string {
    const emojis: Record<string, string> = {
      initializer: '🔍',
      developer: '👨‍💻',
      reviewer: '📋',
      tester: '🧪',
    };
    return emojis[agentName] || '🤖';
  }

  private getActiveAgentCount(agents: readonly AgentStatus[]): number {
    return agents.filter(agent => 
      agent.status === 'monitoring' || agent.status === 'busy'
    ).length;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private formatRelativeTime(timestamp: string): string {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  private formatMetadataKey(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  private formatMetadataValue(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (value instanceof Date) return value.toLocaleString();
    return JSON.stringify(value);
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
      
      h1 {
        color: #333;
        border-bottom: 3px solid #667eea;
        padding-bottom: 15px;
        font-size: 2rem;
      }
      
      .coordination-panel {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border: 1px solid #dee2e6;
        border-radius: 12px;
        padding: 25px;
        margin: 25px 0;
      }
      
      .coordination-panel.error {
        background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
        border-color: #f44336;
      }
      
      .coordination-panel h4 {
        margin: 0 0 20px 0;
        color: #333;
        font-size: 1.3rem;
      }
      
      .coordination-summary {
        display: flex;
        gap: 30px;
        margin-bottom: 30px;
        justify-content: center;
      }
      
      .summary-stat {
        text-align: center;
        padding: 15px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        min-width: 100px;
      }
      
      .stat-number {
        display: block;
        font-size: 2rem;
        font-weight: bold;
        color: #667eea;
        margin-bottom: 5px;
      }
      
      .stat-label {
        display: block;
        font-size: 0.9rem;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .agent-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        margin: 20px 0;
      }
      
      .agent-card {
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 3px 15px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        border-left: 5px solid #28a745;
        cursor: pointer;
      }
      
      .agent-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 25px rgba(0,0,0,0.15);
      }
      
      .agent-card.selected {
        border-left-color: #667eea;
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3);
      }
      
      .agent-card.monitoring {
        border-left-color: #ffc107;
      }
      
      .agent-card.available {
        border-left-color: #28a745;
      }
      
      .agent-card.busy {
        border-left-color: #dc3545;
      }
      
      .agent-card.idle, .agent-card.offline {
        border-left-color: #6c757d;
      }
      
      .agent-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }
      
      .agent-header strong {
        font-size: 1.1rem;
        color: #333;
      }
      
      .status-indicator {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.9rem;
        font-weight: 500;
      }
      
      .agent-details p {
        margin: 8px 0;
        font-size: 0.9rem;
        color: #555;
      }
      
      .capabilities {
        margin: 10px 0;
      }
      
      .capability-tag {
        display: inline-block;
        background: #e9ecef;
        color: #495057;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        margin: 2px;
        font-weight: 500;
      }
      
      .metadata {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #eee;
      }
      
      .metadata-item {
        display: flex;
        justify-content: space-between;
        margin: 5px 0;
        font-size: 0.85rem;
      }
      
      .metadata-key {
        color: #666;
        font-weight: 500;
      }
      
      .metadata-value {
        color: #333;
      }
      
      .action-buttons {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin: 20px 0;
      }
      
      .nav-button, .refresh-button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 12px 24px;
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
      
      .loading-state {
        text-align: center;
        padding: 40px;
      }
      
      .loading-spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 10px;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .features {
        margin-top: 30px;
      }
      
      .features h3 {
        color: #555;
        font-size: 1.3rem;
      }
      
      .features ul {
        list-style: none;
        padding: 0;
      }
      
      .features li {
        margin: 12px 0;
        padding: 12px 15px;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 4px solid #667eea;
        transition: all 0.2s ease;
      }
      
      .features li:hover {
        background: #e9ecef;
        transform: translateX(5px);
      }
      
      small {
        color: #666;
        font-size: 0.85rem;
        font-style: italic;
      }
    `;
  }

  private handleNavigation = (): void => {
    this.setState({ visible: false });
    this.emit('navigate', { page: 'alice' });
    
    // Update URL
    history.pushState(null, '', '/');
  };

  private handleRefresh = async (): Promise<void> => {
    this.setState({ loading: true, error: undefined });
    await this.fetchData();
  };

  private handleAgentSelect = (event: Event): void => {
    const target = event.target as HTMLElement;
    const agentName = target.closest('[data-agent-name]')?.getAttribute('data-agent-name');
    
    if (agentName) {
      const currentSelected = this.getState().selectedAgent;
      this.setState({ 
        selectedAgent: currentSelected === agentName ? undefined : agentName 
      });
      
      this.emit('agent-selected', { agentName });
    }
  };

  private startDataRefresh(): void {
    this.fetchData();
    this.refreshInterval = window.setInterval(() => {
      this.fetchData();
    }, 30000); // Refresh every 30 seconds
  }

  private stopDataRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = undefined;
    }
  }

  private async fetchData(): Promise<void> {
    try {
      const response = await fetch('/api/agents/status');

      if (response.ok) {
        const data = await response.json();
        this.setState({
          agentStatus: data.data,
          loading: false,
          error: undefined,
        });
      } else {
        throw new Error('Failed to fetch agent data');
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
customElements.define('bob-page', BobPageComponent);