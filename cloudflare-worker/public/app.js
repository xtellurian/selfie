// src/components/base-component.ts
var SelfieBaseComponent = class extends HTMLElement {
  shadow;
  state = {};
  eventListeners = /* @__PURE__ */ new Map();
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }
  /**
   * Component lifecycle: Called when element is added to DOM
   */
  connectedCallback() {
    this.render();
    this.attachEventListeners();
    this.onMount?.();
  }
  /**
   * Component lifecycle: Called when element is removed from DOM
   */
  disconnectedCallback() {
    this.removeEventListeners();
    this.onUnmount?.();
  }
  /**
   * Component lifecycle: Called when attributes change
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.onAttributeChange?.(name, oldValue, newValue);
      this.render();
    }
  }
  /**
   * Update component state and trigger re-render
   */
  setState(newState) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };
    this.onStateChange?.(this.state, oldState);
    this.render();
  }
  /**
   * Get current component state
   */
  getState() {
    return { ...this.state };
  }
  /**
   * Add event listener with automatic cleanup
   */
  addEventListenerWithSelector(type, handler, selector) {
    const wrappedHandler = (event) => {
      if (selector) {
        const target = event.target;
        if (target.matches && target.matches(selector)) {
          handler(event);
        }
      } else {
        handler(event);
      }
    };
    const handlers = this.eventListeners.get(type) || [];
    handlers.push(wrappedHandler);
    this.eventListeners.set(type, handlers);
    this.shadow.addEventListener(type, wrappedHandler);
  }
  /**
   * Remove all event listeners
   */
  removeEventListeners() {
    for (const [type, handlers] of this.eventListeners) {
      handlers.forEach((handler) => {
        this.shadow.removeEventListener(type, handler);
      });
    }
    this.eventListeners.clear();
  }
  /**
   * Attach component-specific event listeners
   */
  attachEventListeners() {
  }
  /**
   * Create and return styled template
   */
  createTemplate(html, css = "") {
    const template = document.createElement("template");
    template.innerHTML = `
      ${css ? `<style>${css}</style>` : ""}
      ${html}
    `;
    return template.content.cloneNode(true);
  }
  /**
   * Query element in shadow DOM
   */
  querySelector(selector) {
    return this.shadow.querySelector(selector);
  }
  /**
   * Query all elements in shadow DOM
   */
  querySelectorAll(selector) {
    return this.shadow.querySelectorAll(selector);
  }
  /**
   * Emit custom event
   */
  emit(eventName, detail) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }
};

// src/components/alice-page.ts
var AlicePageComponent = class extends SelfieBaseComponent {
  static observedAttributes = ["visible"];
  refreshInterval;
  constructor() {
    super();
    this.setState({
      visible: true,
      loading: true
    });
  }
  connectedCallback() {
    super.connectedCallback();
    this.startDataRefresh();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopDataRefresh();
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "visible") {
      this.setState({ visible: newValue === "true" });
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }
  render() {
    const state = this.getState();
    if (!state.visible) {
      this.style.display = "none";
      return;
    }
    this.style.display = "block";
    const template = this.createTemplate(
      this.getHtmlTemplate(state),
      this.getCssStyles()
    );
    this.shadow.innerHTML = "";
    this.shadow.appendChild(template);
  }
  attachEventListeners() {
    this.addEventListenerWithSelector("click", this.handleNavigation, '[data-action="navigate-to-bob"]');
    this.addEventListenerWithSelector("click", this.handleRefresh, '[data-action="refresh"]');
  }
  getHtmlTemplate(state) {
    return `
      <div class="page" data-testid="alice-page">
        <h1>\u{1F469}\u200D\u{1F4BB} Alice's Dashboard</h1>
        <p>Welcome to Alice's interface! Monitor and manage Selfie agent activities from here.</p>
        
        ${this.getStatusCardsHtml(state)}
        
        <button 
          class="nav-button" 
          data-testid="go-to-bob-button" 
          data-action="navigate-to-bob"
        >
          \u{1F680} Switch to Bob's Coordination Center
        </button>
        
        <button 
          class="refresh-button" 
          data-action="refresh"
          ${state.loading ? "disabled" : ""}
        >
          ${state.loading ? "\u27F3 Refreshing..." : "\u{1F504} Refresh Data"}
        </button>
        
        <div class="features">
          <div class="features-grid">
            <div class="feature-section">
              <h3>Alice's Capabilities</h3>
              <ul>
                <li>\u{1F4CA} Monitor Selfie agent status and health</li>
                <li>\u{1F3AF} Create and track development tasks</li>
                <li>\u{1F50C} View active MCP server connections</li>
                <li>\u{1F4DD} Manage GitHub issue integration</li>
                <li>\u{1F50D} Real-time system monitoring</li>
              </ul>
            </div>
            
            <div class="feature-section">
              <h3>\u{1F4AC} Chat with Alice</h3>
              <p>Ask Alice about system status, agent coordination, or development workflows.</p>
              <chat-interface agent="alice"></chat-interface>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  getStatusCardsHtml(state) {
    if (state.loading && !state.systemHealth) {
      return `
        <div class="status-card loading">
          <h4>\u{1F504} Loading System Status</h4>
          <p><span class="loading-spinner"></span>Fetching system information...</p>
        </div>
      `;
    }
    if (state.error) {
      return `
        <div class="status-card error">
          <h4>\u274C Error</h4>
          <p>${state.error}</p>
        </div>
      `;
    }
    const systemCard = this.getSystemHealthCardHtml(state.systemHealth);
    const agentCard = this.getAgentStatusCardHtml(state.agentStatus);
    return `${systemCard}${agentCard}`;
  }
  getSystemHealthCardHtml(health) {
    if (!health)
      return "";
    const statusIcon = health.status === "healthy" ? "\u2705" : "\u26A0\uFE0F";
    const statusClass = health.status === "healthy" ? "success" : "warning";
    return `
      <div class="status-card ${statusClass}">
        <h4>\u{1F517} System Health</h4>
        <p>${statusIcon} ${health.service} v${health.version} - ${health.status}</p>
        <small>Last checked: ${new Date(health.timestamp).toLocaleTimeString()}</small>
      </div>
    `;
  }
  getAgentStatusCardHtml(agents) {
    if (!agents)
      return "";
    const activeCount = agents.agents.filter((a) => a.status !== "idle" && a.status !== "offline").length;
    const statusIcon = activeCount > 0 ? "\u{1F7E2}" : "\u{1F7E1}";
    return `
      <div class="status-card">
        <h4>\u{1F916} Agent Status</h4>
        <p>${statusIcon} ${activeCount}/${agents.totalAgents} agents active, ${agents.activeConnections} MCP connections</p>
        <div class="agent-summary">
          ${agents.agents.map((agent) => `
            <span class="agent-badge ${agent.status}">
              ${this.getAgentEmoji(agent.name)} ${agent.name}
            </span>
          `).join("")}
        </div>
        <small>Last updated: ${new Date(agents.lastUpdate).toLocaleTimeString()}</small>
      </div>
    `;
  }
  getAgentEmoji(agentName) {
    const emojis = {
      initializer: "\u{1F50D}",
      developer: "\u{1F468}\u200D\u{1F4BB}",
      reviewer: "\u{1F50D}",
      tester: "\u{1F9EA}"
    };
    return emojis[agentName] || "\u{1F916}";
  }
  getCssStyles() {
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
  handleNavigation = () => {
    this.setState({ visible: false });
    this.emit("navigate", { page: "bob" });
    history.pushState(null, "", "/bob");
  };
  handleRefresh = async () => {
    this.setState({ loading: true, error: void 0 });
    await this.fetchData();
  };
  startDataRefresh() {
    this.fetchData();
    this.refreshInterval = window.setInterval(() => {
      this.fetchData();
    }, 3e4);
  }
  stopDataRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = void 0;
    }
  }
  async fetchData() {
    try {
      const [healthResponse, agentsResponse] = await Promise.all([
        fetch("/api/health"),
        fetch("/api/agents/status")
      ]);
      if (healthResponse.ok && agentsResponse.ok) {
        const healthData = await healthResponse.json();
        const agentsData = await agentsResponse.json();
        this.setState({
          systemHealth: healthData.data,
          agentStatus: agentsData.data,
          loading: false,
          error: void 0
        });
      } else {
        throw new Error("Failed to fetch data");
      }
    } catch (error) {
      this.setState({
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  }
};
customElements.define("alice-page", AlicePageComponent);

// src/components/bob-page.ts
var BobPageComponent = class extends SelfieBaseComponent {
  static observedAttributes = ["visible"];
  refreshInterval;
  constructor() {
    super();
    this.setState({
      visible: false,
      loading: true
    });
  }
  connectedCallback() {
    super.connectedCallback();
    this.startDataRefresh();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopDataRefresh();
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "visible") {
      this.setState({ visible: newValue === "true" });
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }
  render() {
    const state = this.getState();
    if (!state.visible) {
      this.style.display = "none";
      return;
    }
    this.style.display = "block";
    const template = this.createTemplate(
      this.getHtmlTemplate(state),
      this.getCssStyles()
    );
    this.shadow.innerHTML = "";
    this.shadow.appendChild(template);
  }
  attachEventListeners() {
    this.addEventListenerWithSelector("click", this.handleNavigation, '[data-action="navigate-to-alice"]');
    this.addEventListenerWithSelector("click", this.handleRefresh, '[data-action="refresh"]');
    this.addEventListenerWithSelector("click", this.handleAgentSelect, "[data-agent-name]");
  }
  getHtmlTemplate(state) {
    return `
      <div class="page" data-testid="bob-page">
        <h1>\u{1F9E0} Bob's Coordination Center</h1>
        <p>Orchestrate and monitor the entire Selfie ecosystem from this central command interface.</p>
        
        ${this.getCoordinationPanelHtml(state)}
        
        <div class="action-buttons">
          <button 
            class="nav-button" 
            data-testid="go-to-alice-button" 
            data-action="navigate-to-alice"
          >
            \u{1F469}\u200D\u{1F4BB} Switch to Alice's Dashboard
          </button>
          
          <button 
            class="refresh-button" 
            data-action="refresh"
            ${state.loading ? "disabled" : ""}
          >
            ${state.loading ? "\u27F3 Refreshing..." : "\u{1F504} Refresh Agents"}
          </button>
        </div>
        
        <div class="features">
          <div class="features-grid">
            <div class="feature-section">
              <h3>Bob's Control Systems</h3>
              <ul>
                <li>\u{1F39B}\uFE0F Coordinate multiple Selfie instances across networks</li>
                <li>\u{1F4CB} Review and approve automated pull requests</li>
                <li>\u{1F4CA} Monitor development task queues and priorities</li>
                <li>\u{1F504} Manage system health and performance metrics</li>
                <li>\u{1F310} Oversee MCP server coordination protocols</li>
              </ul>
            </div>
            
            <div class="feature-section">
              <h3>\u{1F4AC} Chat with Bob</h3>
              <p>Discuss coordination strategies, workflow optimization, and system architecture with Bob.</p>
              <chat-interface agent="bob"></chat-interface>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  getCoordinationPanelHtml(state) {
    if (state.loading && !state.agentStatus) {
      return `
        <div class="coordination-panel">
          <h4>\u{1F916} Agent Coordination Dashboard</h4>
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
          <h4>\u274C Coordination Error</h4>
          <p>${state.error}</p>
        </div>
      `;
    }
    if (!state.agentStatus) {
      return `
        <div class="coordination-panel">
          <h4>\u{1F916} Agent Coordination Dashboard</h4>
          <p>No agent data available.</p>
        </div>
      `;
    }
    return `
      <div class="coordination-panel">
        <h4>\u{1F916} Agent Coordination Dashboard</h4>
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
          ${state.agentStatus.agents.map((agent) => this.getAgentCardHtml(agent, state.selectedAgent)).join("")}
        </div>
        
        <small>Last updated: ${new Date(state.agentStatus.lastUpdate).toLocaleTimeString()}</small>
      </div>
    `;
  }
  getAgentCardHtml(agent, selectedAgent) {
    const isSelected = selectedAgent === agent.name;
    const statusIcon = this.getStatusIcon(agent.status);
    const agentEmoji = this.getAgentEmoji(agent.name);
    return `
      <div 
        class="agent-card ${agent.status} ${isSelected ? "selected" : ""}"
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
          ` : ""}
          
          ${agent.capabilities ? `
            <div class="capabilities">
              <strong>Capabilities:</strong>
              ${agent.capabilities.map((cap) => `<span class="capability-tag">${cap}</span>`).join("")}
            </div>
          ` : ""}
          
          ${agent.metadata ? this.getMetadataHtml(agent.metadata) : ""}
        </div>
      </div>
    `;
  }
  getMetadataHtml(metadata) {
    const relevantKeys = Object.keys(metadata).slice(0, 3);
    if (relevantKeys.length === 0)
      return "";
    return `
      <div class="metadata">
        ${relevantKeys.map((key) => `
          <div class="metadata-item">
            <span class="metadata-key">${this.formatMetadataKey(key)}:</span>
            <span class="metadata-value">${this.formatMetadataValue(metadata[key])}</span>
          </div>
        `).join("")}
      </div>
    `;
  }
  getStatusIcon(status) {
    const icons = {
      monitoring: "\u{1F7E1}",
      available: "\u{1F7E2}",
      busy: "\u{1F534}",
      idle: "\u26AA",
      offline: "\u26AB"
    };
    return icons[status] || "\u2753";
  }
  getAgentEmoji(agentName) {
    const emojis = {
      initializer: "\u{1F50D}",
      developer: "\u{1F468}\u200D\u{1F4BB}",
      reviewer: "\u{1F4CB}",
      tester: "\u{1F9EA}"
    };
    return emojis[agentName] || "\u{1F916}";
  }
  getActiveAgentCount(agents) {
    return agents.filter(
      (agent) => agent.status === "monitoring" || agent.status === "busy"
    ).length;
  }
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  formatRelativeTime(timestamp) {
    const now = /* @__PURE__ */ new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 6e4);
    if (diffMins < 1)
      return "Just now";
    if (diffMins < 60)
      return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }
  formatMetadataKey(key) {
    return key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
  }
  formatMetadataValue(value) {
    if (typeof value === "string")
      return value;
    if (typeof value === "number")
      return value.toString();
    if (value instanceof Date)
      return value.toLocaleString();
    return JSON.stringify(value);
  }
  getCssStyles() {
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
        font-style: italic;
      }
    `;
  }
  handleNavigation = () => {
    this.setState({ visible: false });
    this.emit("navigate", { page: "alice" });
    history.pushState(null, "", "/");
  };
  handleRefresh = async () => {
    this.setState({ loading: true, error: void 0 });
    await this.fetchData();
  };
  handleAgentSelect = (event) => {
    const target = event.target;
    const agentName = target.closest("[data-agent-name]")?.getAttribute("data-agent-name");
    if (agentName) {
      const currentSelected = this.getState().selectedAgent;
      this.setState({
        selectedAgent: currentSelected === agentName ? void 0 : agentName
      });
      this.emit("agent-selected", { agentName });
    }
  };
  startDataRefresh() {
    this.fetchData();
    this.refreshInterval = window.setInterval(() => {
      this.fetchData();
    }, 3e4);
  }
  stopDataRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = void 0;
    }
  }
  async fetchData() {
    try {
      const response = await fetch("/api/agents/status");
      if (response.ok) {
        const data = await response.json();
        this.setState({
          agentStatus: data.data,
          loading: false,
          error: void 0
        });
      } else {
        throw new Error("Failed to fetch agent data");
      }
    } catch (error) {
      this.setState({
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  }
};
customElements.define("bob-page", BobPageComponent);

// src/frontend/app.ts
var SelfieApp = class {
  currentPage = "alice";
  constructor() {
    this.initializeRouting();
    this.initializeNavigation();
    this.setupGlobalErrorHandling();
  }
  initializeRouting() {
    this.handleRoute();
    window.addEventListener("popstate", () => this.handleRoute());
  }
  handleRoute() {
    const path = window.location.pathname;
    const alicePage = document.querySelector("alice-page");
    const bobPage = document.querySelector("bob-page");
    if (path === "/bob" || path.includes("bob")) {
      this.currentPage = "bob";
      alicePage?.setAttribute("visible", "false");
      bobPage?.setAttribute("visible", "true");
    } else {
      this.currentPage = "alice";
      alicePage?.setAttribute("visible", "true");
      bobPage?.setAttribute("visible", "false");
    }
  }
  initializeNavigation() {
    document.addEventListener("navigate", (event) => {
      const detail = event.detail;
      if (detail?.page) {
        this.navigateTo(detail.page);
      }
    });
  }
  navigateTo(page) {
    const url = page === "alice" ? "/" : "/bob";
    history.pushState(null, "", url);
    this.handleRoute();
  }
  setupGlobalErrorHandling() {
    window.addEventListener("error", (event) => {
      console.error("Global error:", event.error);
    });
    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection:", event.reason);
    });
  }
};
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new SelfieApp();
  });
} else {
  new SelfieApp();
}
var app_default = SelfieApp;
export {
  app_default as default
};
//# sourceMappingURL=app.js.map
