import '../src/checkout-style.css';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TIERS = [
  {
    id: 'basic',
    label: 'Basic',
    price: '$49',
    period: '/year',
    description: 'County-level access to AFIDA flagged parcel data for single-jurisdiction research.',
    features: [
      'County-level risk data',
      'Up to 500 records per query',
      'Flag scores & tier classification',
      'CSV export',
      'Email support',
    ],
    note: 'Ideal for county assessors, local officials, and academic researchers.',
    recommended: false,
  },
  {
    id: 'pro',
    label: 'Professional',
    price: '$99',
    period: '/year',
    description: 'State-level access with full flag detail and API endpoint for integration.',
    features: [
      'State-level risk data',
      'Up to 5,000 records per query',
      'Full 15-flag breakdown',
      'API access (JSON/CSV)',
      'Military proximity data',
      'Priority support',
    ],
    note: 'Designed for policy teams, law firms, and state agencies.',
    recommended: true,
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    price: '$199',
    period: '/year',
    description: 'National dataset access with bulk export, full audit trail, and reproducibility runbook.',
    features: [
      'Full national dataset',
      'Unlimited record queries',
      'Bulk CSV/JSON export',
      'Pipeline reproducibility runbook',
      'County risk summary view',
      'Dedicated account support',
      'Custom briefings available',
    ],
    note: 'For federal agencies, investment firms, and national security teams.',
    recommended: false,
  },
];

let currentUser = null;

async function init() {
  const { data: { user } } = await supabase.auth.getUser();
  currentUser = user;
  render();
}

function render() {
  document.getElementById('app').innerHTML = `
    <nav class="navbar">
      <div class="nav-container">
        <a href="/" class="logo">AFIDA Intelligence</a>
        <div class="nav-links">
          <a href="/" class="nav-link">Overview</a>
          <a href="/map.html" class="nav-link">Risk Analysis</a>
          <a href="/geo-map.html" class="nav-link">Map</a>
          <a href="/checkout.html" class="nav-link active">Access Data</a>
          ${currentUser ? `<a href="/portal.html" class="nav-link">Portal</a><button class="btn-signout" id="signout-btn">Sign Out</button>` : ''}
        </div>
      </div>
    </nav>

    <div class="checkout-container">
      <div class="checkout-header">
        <h1>Access AFIDA Intelligence Data</h1>
        <p>Select the tier that matches your research scope and jurisdiction requirements.</p>
      </div>

      ${!currentUser ? `
      <div class="auth-container">
        <div class="auth-tabs">
          <button class="auth-tab active" data-tab="signin">Sign In</button>
          <button class="auth-tab" data-tab="signup">Create Account</button>
        </div>

        <div class="auth-form" id="form-signin">
          <h2>Sign In</h2>
          <p class="auth-subtitle">Access your existing account to continue.</p>
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="signin-email" placeholder="you@organization.gov" />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="signin-password" placeholder="Password" />
          </div>
          <div class="error-message" id="signin-error"></div>
          <button class="export-btn full-width" id="signin-btn">Sign In</button>
        </div>

        <div class="auth-form hidden" id="form-signup">
          <h2>Create Account</h2>
          <p class="auth-subtitle">Register to complete your purchase.</p>
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="signup-email" placeholder="you@organization.gov" />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="signup-password" placeholder="Min. 8 characters" />
          </div>
          <div class="form-group">
            <label>Organization</label>
            <input type="text" id="signup-org" placeholder="Agency or organization name" />
          </div>
          <div class="error-message" id="signup-error"></div>
          <button class="export-btn full-width" id="signup-btn">Create Account</button>
        </div>
      </div>
      ` : ''}

      <div class="tier-selection${!currentUser ? ' disabled' : ''}">
        ${TIERS.map(tier => `
          <div class="tier-card-checkout${tier.recommended ? ' recommended' : ''}">
            ${tier.recommended ? '<div class="recommended-banner">MOST POPULAR</div>' : ''}
            <div class="tier-badge${tier.recommended ? ' recommended-badge' : ''}">${tier.label.toUpperCase()}</div>
            <h3>${tier.label}</h3>
            <p class="tier-description">${tier.description}</p>
            <div class="tier-price">
              <span class="price-amount">${tier.price}</span>
              <span class="price-period">${tier.period}</span>
            </div>
            <ul class="tier-features">
              ${tier.features.map(f => `<li>${f}</li>`).join('')}
            </ul>
            <p class="tier-note">${tier.note}</p>
            <button class="export-btn select-tier-btn" data-tier="${tier.id}">
              ${currentUser ? 'Select & Pay' : 'Sign In to Purchase'}
            </button>
          </div>
        `).join('')}
      </div>

      <div class="checkout-footer">
        <div class="footer-note">
          <strong>Government & Institutional Pricing:</strong> Contact us for multi-seat licensing, bulk access agreements, or custom data delivery arrangements.
          All data is derived from USDA AFIDA public disclosures. Access is for research and policy purposes only.
        </div>
      </div>
    </div>
  `;

  attachHandlers();
}

function attachHandlers() {
  document.getElementById('signout-btn')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    currentUser = null;
    render();
  });

  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      document.getElementById('form-signin').classList.toggle('hidden', target !== 'signin');
      document.getElementById('form-signup').classList.toggle('hidden', target !== 'signup');
    });
  });

  document.getElementById('signin-btn')?.addEventListener('click', async () => {
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;
    const errEl = document.getElementById('signin-error');
    errEl.textContent = '';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { errEl.textContent = error.message; return; }
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;
    render();
  });

  document.getElementById('signup-btn')?.addEventListener('click', async () => {
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const org = document.getElementById('signup-org').value.trim();
    const errEl = document.getElementById('signup-error');
    errEl.textContent = '';
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { organization: org } } });
    if (error) { errEl.textContent = error.message; return; }
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;
    render();
  });

  document.querySelectorAll('.select-tier-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!currentUser) return;
      const tier = btn.dataset.tier;
      btn.disabled = true;
      btn.textContent = 'Processing...';
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ tier }),
        });
        const json = await res.json();
        if (json.url) {
          window.location.href = json.url;
        } else {
          btn.disabled = false;
          btn.textContent = 'Select & Pay';
          alert(json.error || 'Could not create checkout session.');
        }
      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Select & Pay';
        alert('An error occurred. Please try again.');
      }
    });
  });
}

init();
