import '../src/portal-style.css';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TIER_META = {
  Basic: { icon: '◎', desc: 'County-level access', features: ['County risk data', 'Up to 500 records', 'Flag scores', 'CSV export'] },
  Professional: { icon: '◈', desc: 'State-level access with API', features: ['State risk data', 'Up to 5,000 records', 'API access', 'Military proximity data'] },
  Enterprise: { icon: '◉', desc: 'Full national dataset', features: ['National dataset', 'Unlimited queries', 'Bulk export', 'Reproducibility runbook'] },
  Government: { icon: '⊕', desc: 'Full access with custom support', features: ['Full national dataset', 'Custom delivery', 'Dedicated support', 'Priority briefings'] },
};

const DATASET_ACCESS = {
  Basic: [
    { name: 'County Risk Data', desc: 'Flagged parcels at county level', tags: ['CSV'], available: true },
    { name: 'State Risk Data', desc: 'State-aggregated risk summaries', tags: ['Locked'], available: false },
    { name: 'National Export', desc: 'Full national parcel dataset', tags: ['Locked'], available: false },
  ],
  Professional: [
    { name: 'County Risk Data', desc: 'Flagged parcels at county level', tags: ['CSV', 'JSON'], available: true },
    { name: 'State Risk Data', desc: 'State-aggregated risk summaries', tags: ['API', 'CSV'], available: true },
    { name: 'National Export', desc: 'Full national parcel dataset', tags: ['Locked'], available: false },
  ],
  Enterprise: [
    { name: 'County Risk Data', desc: 'Flagged parcels at county level', tags: ['CSV', 'JSON'], available: true },
    { name: 'State Risk Data', desc: 'State-aggregated risk summaries', tags: ['API', 'CSV'], available: true },
    { name: 'National Export', desc: 'Full national parcel dataset', tags: ['CSV', 'JSON'], available: true },
  ],
  Government: [
    { name: 'County Risk Data', desc: 'Flagged parcels at county level', tags: ['CSV', 'JSON'], available: true },
    { name: 'State Risk Data', desc: 'State-aggregated risk summaries', tags: ['API', 'CSV'], available: true },
    { name: 'National Export', desc: 'Full national parcel dataset', tags: ['CSV', 'JSON'], available: true },
  ],
};

let currentUser = null;
let subscription = null;
let customer = null;
let activeTab = 'overview';

async function init() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = '/checkout.html';
    return;
  }
  currentUser = user;

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  subscription = sub;

  const { data: cust } = await supabase
    .from('customers')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  customer = cust;

  render();
}

function render() {
  const tier = subscription?.tier ? capitalize(subscription.tier) : null;
  const tierMeta = tier ? TIER_META[tier] : null;
  const datasets = tier ? (DATASET_ACCESS[tier] || DATASET_ACCESS['Basic']) : [];
  const isActive = subscription?.status === 'active';

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  document.getElementById('app').innerHTML = `
    <div class="portal-page">
      <nav class="navbar">
        <div class="nav-container">
          <a href="/" class="logo">AFIDA Intelligence</a>
          <div class="nav-links">
            <a href="/" class="nav-link">Overview</a>
            <a href="/map.html" class="nav-link">Risk Analysis</a>
            <a href="/geo-map.html" class="nav-link">Map</a>
            <a href="/portal.html" class="nav-link active">Portal</a>
            <button class="nav-link signout" id="signout-btn">Sign Out</button>
          </div>
        </div>
      </nav>

      <div class="portal-wrapper">
        <div class="portal-topbar">
          <div class="portal-identity">
            <h1>My Account</h1>
            <div class="portal-email">${currentUser.email}</div>
          </div>
          <div class="portal-status-pill${isActive ? ' active' : ' inactive'}">
            <div class="portal-status-dot"></div>
            ${isActive ? 'Active Subscription' : 'No Active Subscription'}
          </div>
        </div>

        <div class="portal-tabs">
          <button class="portal-tab${activeTab === 'overview' ? ' active' : ''}" data-tab="overview">Overview</button>
          <button class="portal-tab${activeTab === 'data' ? ' active' : ''}" data-tab="data">Data Access</button>
          <button class="portal-tab${activeTab === 'account' ? ' active' : ''}" data-tab="account">Account</button>
        </div>

        <div class="portal-tab-panel${activeTab === 'overview' ? ' active' : ''}">
          ${tier ? `
            <div class="tier-display">
              <div class="tier-icon">${tierMeta?.icon || '◎'}</div>
              <div>
                <div class="tier-info-name">${tier} Plan</div>
                <div class="tier-info-desc">${tierMeta?.desc || ''}</div>
              </div>
            </div>

            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Plan Status</div>
                <div class="stat-value${isActive ? ' green' : ' red'}">${isActive ? 'Active' : 'Inactive'}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Renewal Date</div>
                <div class="stat-value" style="font-size:1.25rem">${periodEnd}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Tier</div>
                <div class="stat-value amber">${tier}</div>
              </div>
            </div>

            <p class="portal-section-title">Included Features</p>
            <div class="pcard">
              <ul class="feature-list">
                ${(tierMeta?.features || []).map(f => `<li><span class="feature-check">✓</span>${f}</li>`).join('')}
              </ul>
            </div>

            <p class="portal-section-title">Quick Actions</p>
            <div class="action-grid">
              <a href="/map.html" class="action-btn primary-action"><span class="action-icon">◎</span>Risk Analysis</a>
              <a href="/geo-map.html" class="action-btn"><span class="action-icon">◈</span>Geographic Map</a>
              <button class="action-btn" id="download-btn"><span class="action-icon">↓</span>Download Data</button>
            </div>
          ` : `
            <div class="no-sub-cta">
              <h3>No Active Subscription</h3>
              <p>Purchase a plan to access AFIDA intelligence data and risk analysis tools.</p>
              <a href="/checkout.html">View Plans →</a>
            </div>
          `}
        </div>

        <div class="portal-tab-panel${activeTab === 'data' ? ' active' : ''}">
          <p class="portal-section-title">Dataset Access</p>
          <div class="dataset-access-grid">
            ${datasets.map(ds => `
              <div class="dataset-card ${ds.available ? 'available' : 'locked'}">
                <div class="dataset-card-header">
                  <div class="dataset-name">${ds.name}</div>
                  <div class="dataset-lock">${ds.available ? '' : 'LOCKED'}</div>
                </div>
                <div class="dataset-desc">${ds.desc}</div>
                <div class="dataset-meta">
                  ${ds.tags.map(tag => `<span class="dataset-tag${tag === 'Locked' ? '' : ' green'}">${tag}</span>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="portal-tab-panel${activeTab === 'account' ? ' active' : ''}">
          <div class="two-col">
            <div>
              <p class="portal-section-title">Account Details</p>
              <div class="pcard">
                <div class="data-row">
                  <span class="data-label">Email</span>
                  <span class="data-value">${currentUser.email}</span>
                </div>
                <div class="data-row">
                  <span class="data-label">Account ID</span>
                  <span class="data-value mono">${currentUser.id.slice(0,8)}...</span>
                </div>
                <div class="data-row">
                  <span class="data-label">Member Since</span>
                  <span class="data-value">${new Date(currentUser.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
                </div>
              </div>
            </div>

            <div>
              <p class="portal-section-title">Subscription</p>
              <div class="pcard">
                <div class="data-row">
                  <span class="data-label">Plan</span>
                  <span class="data-value">${tier || 'None'}</span>
                </div>
                <div class="data-row">
                  <span class="data-label">Status</span>
                  <span class="data-value">
                    <span class="status-badge ${isActive ? 'active' : 'expired'}">${subscription?.status || 'None'}</span>
                  </span>
                </div>
                <div class="data-row">
                  <span class="data-label">Expires</span>
                  <span class="data-value">${periodEnd}</span>
                </div>
              </div>
            </div>
          </div>

          <p class="portal-section-title">Change Password</p>
          <div class="pcard">
            <div class="form-field">
              <label>New Password</label>
              <input type="password" id="new-password" placeholder="Min. 8 characters" />
            </div>
            <button class="save-btn" id="save-password-btn">Update Password</button>
            <span class="save-feedback" id="password-feedback">Saved!</span>
          </div>
        </div>
      </div>
    </div>
  `;

  attachHandlers();
}

function attachHandlers() {
  document.getElementById('signout-btn')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  });

  document.querySelectorAll('.portal-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeTab = tab.dataset.tab;
      render();
    });
  });

  document.getElementById('download-btn')?.addEventListener('click', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/data-api/holdings?limit=500&format=csv`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    });
    if (!res.ok) { alert('Download unavailable. Check your subscription tier.'); return; }
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'afida_holdings.csv';
    a.click();
  });

  document.getElementById('save-password-btn')?.addEventListener('click', async () => {
    const pw = document.getElementById('new-password').value;
    if (!pw || pw.length < 8) { alert('Password must be at least 8 characters.'); return; }
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { alert(error.message); return; }
    const fb = document.getElementById('password-feedback');
    fb.classList.add('visible');
    setTimeout(() => fb.classList.remove('visible'), 3000);
  });
}

function capitalize(str) {
  if (!str) return '';
  const map = { basic: 'Basic', pro: 'Professional', professional: 'Professional', enterprise: 'Enterprise', government: 'Government' };
  return map[str.toLowerCase()] || str.charAt(0).toUpperCase() + str.slice(1);
}

init();
