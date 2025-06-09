import { html, define } from 'hybrids';

export const BobPage = {
  visible: false,
  render: ({ visible }) => html`
    <div class="page ${visible ? 'active' : ''}" data-testid="bob-page">
      <h1>Bob's Page</h1>
      <p>Welcome to Bob's page! This is where Bob can manage Selfie coordination.</p>
      <button 
        class="nav-button" 
        data-testid="go-to-alice-button"
        onclick="${html.set('visible', false)}"
      >
        Go to Alice's Page
      </button>
      <div class="features">
        <h3>Bob's Features</h3>
        <ul>
          <li>Coordinate multiple Selfie instances</li>
          <li>Review pull requests and code changes</li>
          <li>Manage development task queues</li>
        </ul>
      </div>
    </div>
  `,
};

define('bob-page', BobPage);