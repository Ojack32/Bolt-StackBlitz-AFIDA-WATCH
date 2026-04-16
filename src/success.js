import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TIER_LABELS = { basic: 'Basic', pro: 'Professional', professional: 'Professional', enterprise: 'Enterprise', government: 'Government' };
const TIER_PRICES = { basic: '$49/year', pro: '$99/year', professional: '$99/year', enterprise: '$199/year', government: '$199/year' };

async function init() {
  const params = new URLSearchParams(window.location.search);
  const tier = params.get('tier') || 'basic';
  const tierLabel = TIER_LABELS[tier] || 'Unknown';
  const tierPrice = TIER_PRICES[tier] || '—';

  const { data: { user } } = await supabase.auth.getUser();

  document.getElementById('app').innerHTML = `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #0B1C2D; color: #E9EEF3; font-family: 'Source Sans 3', system-ui, sans-serif; }
      .navbar { background: #0B1C2D; border-bottom: 1px solid rgba(255,255,255,0.10); padding: 0 24px; }
      .nav-container { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 60px; }
      .logo { font-family: 'IBM Plex Sans', sans-serif; font-weight: 700; font-size: 1.125rem; color: #E9EEF3; text-decoration: none; }
      .nav-link { padding: 7px 14px; border-radius: 8px; text-decoration: none; font-family: 'IBM Plex Sans', sans-serif; font-size: 0.875rem; font-weight: 500; color: #B9C4CE; transition: all 0.15s ease; }
      .nav-link:hover { color: #E9EEF3; background: rgba(255,255,255,0.06); }

      .success-page { max-width: 680px; margin: 0 auto; padding: 64px 24px; text-align: center; }
      .success-icon-wrap { width: 96px; height: 96px; border-radius: 50%; background: rgba(52, 211, 153, 0.12); border: 2px solid rgba(52, 211, 153, 0.3); display: flex; align-items: center; justify-content: center; margin: 0 auto 32px; font-size: 2.5rem; animation: scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1); }
      @keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }

      .success-page h1 { font-family: 'IBM Plex Sans', sans-serif; font-size: 2rem; font-weight: 700; color: #E9EEF3; margin-bottom: 12px; letter-spacing: -0.02em; }
      .success-page .subtitle { font-size: 1.0625rem; color: #B9C4CE; margin-bottom: 40px; line-height: 1.6; }

      .detail-card { background: #122B40; border: 1px solid rgba(255,255,255,0.10); border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: left; }
      .detail-card h3 { font-family: 'IBM Plex Sans', sans-serif; font-size: 0.875rem; font-weight: 700; color: #B9C4CE; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
      .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 0.9375rem; }
      .detail-row:last-child { border-bottom: none; }
      .detail-label { color: #B9C4CE; }
      .detail-value { font-weight: 600; color: #E9EEF3; font-family: 'IBM Plex Sans', sans-serif; }
      .detail-value.amber { color: #C69214; }
      .detail-value.green { color: #34d399; }

      .next-steps-card { background: rgba(198,146,20,0.06); border: 1px solid rgba(198,146,20,0.2); border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: left; }
      .next-steps-card h3 { font-family: 'IBM Plex Sans', sans-serif; font-size: 1rem; font-weight: 700; color: #C69214; margin-bottom: 16px; }
      .step { display: flex; gap: 14px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); align-items: flex-start; }
      .step:last-child { border-bottom: none; }
      .step-num { width: 24px; height: 24px; border-radius: 50%; background: rgba(198,146,20,0.15); color: #C69214; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-family: 'IBM Plex Mono', monospace; margin-top: 1px; }
      .step-text { font-size: 0.9375rem; color: #E9EEF3; line-height: 1.5; }

      .cta-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
      .btn-primary { padding: 12px 28px; background: #C69214; color: #111; border: none; border-radius: 8px; font-family: 'IBM Plex Sans', sans-serif; font-size: 0.9375rem; font-weight: 700; cursor: pointer; text-decoration: none; transition: filter 0.15s; }
      .btn-primary:hover { filter: brightness(1.05); }
      .btn-secondary { padding: 12px 28px; background: none; color: #B9C4CE; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; font-family: 'IBM Plex Sans', sans-serif; font-size: 0.9375rem; font-weight: 600; cursor: pointer; text-decoration: none; transition: all 0.15s; }
      .btn-secondary:hover { color: #E9EEF3; border-color: rgba(255,255,255,0.3); }
    </style>

    <nav class="navbar">
      <div class="nav-container">
        <a href="/" class="logo">AFIDA Intelligence</a>
        <div style="display:flex;gap:4px">
          <a href="/" class="nav-link">Overview</a>
          <a href="/map.html" class="nav-link">Risk Analysis</a>
          <a href="/portal.html" class="nav-link">Portal</a>
        </div>
      </div>
    </nav>

    <div class="success-page">
      <div class="success-icon-wrap">✓</div>
      <h1>Purchase Confirmed</h1>
      <p class="subtitle">Your ${tierLabel} subscription is now active. You can access the full dataset and analysis tools immediately.</p>

      <div class="detail-card">
        <h3>Order Summary</h3>
        <div class="detail-row">
          <span class="detail-label">Plan</span>
          <span class="detail-value amber">${tierLabel}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Price</span>
          <span class="detail-value">${tierPrice}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status</span>
          <span class="detail-value green">Active</span>
        </div>
        ${user ? `<div class="detail-row"><span class="detail-label">Account</span><span class="detail-value">${user.email}</span></div>` : ''}
        <div class="detail-row">
          <span class="detail-label">Data Source</span>
          <span class="detail-value">AFIDA 2024 Annual Disclosure</span>
        </div>
      </div>

      <div class="next-steps-card">
        <h3>Next Steps</h3>
        <div class="step"><div class="step-num">1</div><div class="step-text">Visit your Customer Portal to confirm subscription details and access API credentials.</div></div>
        <div class="step"><div class="step-num">2</div><div class="step-text">Use Risk Analysis to explore flagged parcels by tier, state, and flag category.</div></div>
        <div class="step"><div class="step-num">3</div><div class="step-text">View the Geographic Map for spatial distribution of foreign-held parcels near installations.</div></div>
        <div class="step"><div class="step-num">4</div><div class="step-text">Download the Reproducibility Runbook to understand the full pipeline methodology.</div></div>
      </div>

      <div class="cta-row">
        <a href="/portal.html" class="btn-primary">Go to My Portal</a>
        <a href="/map.html" class="btn-secondary">Explore Risk Analysis</a>
      </div>
    </div>
  `;
}

init();
