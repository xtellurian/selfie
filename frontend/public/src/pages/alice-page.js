import { html, define } from 'hybrids';

export const AlicePage = {
  visible: false,
  render: ({ visible }) => html`
    <div class="page ${visible ? 'active' : ''}" data-testid="alice-page">
      <h1>Alice's Page</h1>
      <p>Welcome to Alice's page! This is where Alice can interact with Selfie instances.</p>
      <button 
        class="nav-button" 
        data-testid="go-to-bob-button"
        onclick="${html.set('visible', false)}"
      >
        Go to Bob's Page
      </button>
      <div class="features">
        <h3>Alice's Features</h3>
        <ul>
          <li>Monitor Selfie agent status</li>
          <li>Create new development tasks</li>
          <li>View active MCP connections</li>
        </ul>
      </div>
    </div>
  `,
};

define('alice-page', AlicePage);