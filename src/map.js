import '../src/map-style.css';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TIERS = [
  { id: 'CRITICAL', label: 'Critical', icon: '!', color: '#8B1E1E', cls: 'tier-critical' },
  { id: 'HIGH',     label: 'High',     icon: '▲', color: '#B85C2E', cls: 'tier-high' },
  { id: 'MEDIUM',   label: 'Medium',   icon: '●', color: '#7A8A3A', cls: 'tier-medium' },
  { id: 'LOW',      label: 'Low',      icon: '○', color: '#3A6F8A', cls: 'tier-low' },
  { id: 'NONE',     label: 'None',     icon: '–', color: '#4A5A67', cls: 'tier-none' },
];

const PIPELINE_HASH = 'afida_2024_v2_hash_a3f9';
const RECORD_COUNT = '49,548';
const FLAG_COUNT = '15,241';
const TIER_COUNTS = { CRITICAL: 312, HIGH: 1247, MEDIUM: 4892, LOW: 8790, NONE: 0 };

let selectedTier = null;
let allRecords = [];
let filteredRecords = [];

function renderApp() {
  document.getElementById('app').innerHTML = `
    <nav class="navbar">
      <div class="nav-container">
        <span class="logo">AFIDA Intelligence</span>
        <div class="nav-links">
          <a href="/" class="nav-link">Overview</a>
          <a href="/map.html" class="nav-link active">Risk Analysis</a>
          <a href="/geo-map.html" class="nav-link">Map</a>
          <a href="/checkout.html" class="nav-link">Access Data</a>
        </div>
      </div>
    </nav>

    <div class="analysis-container">
      <div class="tier-navigation">
        <div class="tier-header">
          <h2>Risk Tier Analysis</h2>
          <div class="audit-badge">
            <span class="audit-label">Pipeline Hash:</span>
            <span class="audit-value">${PIPELINE_HASH}</span>
            <span class="audit-label" style="margin-left:12px">Records:</span>
            <span class="audit-value">${RECORD_COUNT}</span>
          </div>
        </div>
        <div class="tier-selection-row">
          <div class="tier-cards" id="tier-cards"></div>
          <div class="map-about-panel">
            <div class="panel-title">About Risk Tiers</div>
            <div class="panel-content">
              <p>Parcels are scored using a composite algorithm combining 15 flag dimensions across adversary-nation ownership, proximity to military installations, trust/beneficiary opacity, and leasehold structure.</p>
              <p>Select a tier to view detailed records, flag distribution, and top risk drivers.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="analysis-main" id="analysis-main">
        <div class="welcome-state">
          <div class="welcome-icon">◎</div>
          <h2>Select a Risk Tier</h2>
          <p>Choose a tier above to explore flagged parcels and their risk drivers.</p>
        </div>
      </div>
    </div>
  `;

  renderTierCards();
}

function renderTierCards() {
  const container = document.getElementById('tier-cards');
  container.innerHTML = TIERS.map(t => `
    <div class="tier-card ${t.cls}${selectedTier === t.id ? ' selected' : ''}" data-tier="${t.id}">
      <div class="tier-icon">${t.icon}</div>
      <div class="tier-name">${t.label}</div>
      <div class="tier-count">${(TIER_COUNTS[t.id] || 0).toLocaleString()}</div>
      <div class="tier-desc">parcels</div>
    </div>
  `).join('');

  container.querySelectorAll('.tier-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedTier = card.dataset.tier;
      renderTierCards();
      loadTierData(selectedTier);
    });
  });
}

async function loadTierData(tier) {
  const main = document.getElementById('analysis-main');
  main.innerHTML = `<div class="welcome-state"><div class="welcome-icon">⟳</div><h2>Loading ${tier} records...</h2></div>`;

  const { data, error } = await supabase
    .from('flagged_parcels')
    .select('state,county,owner_name,country,acres,risk_score,risk_tier,flag_adversary_nation,flag_ambiguity,flag_trust_beneficiary,flag_leasehold,flag_secondary_any,has_hard_flag,top_reason_codes')
    .eq('risk_tier', tier)
    .order('risk_score', { ascending: false })
    .limit(500);

  if (error) {
    main.innerHTML = `<div class="welcome-state"><h2>Error loading data</h2><p>${error.message}</p></div>`;
    return;
  }

  allRecords = data || [];
  filteredRecords = [...allRecords];
  renderTierAnalysis(tier);
}

function renderTierAnalysis(tier) {
  const tierDef = TIERS.find(t => t.id === tier);
  const main = document.getElementById('analysis-main');

  const totalAcres = allRecords.reduce((s, r) => s + (r.acres || 0), 0);
  const avgScore = allRecords.length ? (allRecords.reduce((s, r) => s + (r.risk_score || 0), 0) / allRecords.length).toFixed(1) : 0;
  const hardFlagCount = allRecords.filter(r => r.has_hard_flag).length;

  const stateCounts = {};
  allRecords.forEach(r => { stateCounts[r.state] = (stateCounts[r.state] || 0) + 1; });
  const topStates = Object.entries(stateCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const flagFields = ['flag_adversary_nation','flag_ambiguity','flag_trust_beneficiary','flag_leasehold','flag_secondary_any'];
  const flagLabels = { flag_adversary_nation: 'Adversary Nation', flag_ambiguity: 'Ownership Ambiguity', flag_trust_beneficiary: 'Trust/Beneficiary', flag_leasehold: 'Leasehold Structure', flag_secondary_any: 'Secondary Flag' };
  const flagCounts = {};
  flagFields.forEach(f => { flagCounts[f] = allRecords.filter(r => r[f]).length; });
  const maxFlag = Math.max(...Object.values(flagCounts), 1);

  const maxState = topStates.length ? topStates[0][1] : 1;

  const reasonCounts = {};
  allRecords.forEach(r => {
    (r.top_reason_codes || '').split(',').map(s => s.trim()).filter(Boolean).forEach(code => {
      reasonCounts[code] = (reasonCounts[code] || 0) + 1;
    });
  });
  const topReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  let activeFilters = { state: null };

  function buildHTML() {
    const rows = filteredRecords.slice(0, 200);
    return `
      <div class="tier-analysis">
        <div class="analysis-header">
          <div class="tier-title">
            <h1>${tierDef.label} Risk</h1>
            <span class="record-count">${allRecords.length.toLocaleString()} parcels</span>
          </div>
          <button class="export-btn" id="export-btn">Export CSV</button>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">Total Parcels</div>
            <div class="summary-value">${allRecords.length.toLocaleString()}</div>
            <div class="summary-sub">${tier} tier</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Total Acres</div>
            <div class="summary-value">${Math.round(totalAcres).toLocaleString()}</div>
            <div class="summary-sub">under scrutiny</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Avg Risk Score</div>
            <div class="summary-value">${avgScore}</div>
            <div class="summary-sub">out of 100</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Hard Flag Count</div>
            <div class="summary-value">${hardFlagCount.toLocaleString()}</div>
            <div class="summary-sub">critical flags present</div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <h3>Flagged Parcels</h3>
            <span class="panel-subtitle">Showing ${Math.min(filteredRecords.length, 200)} of ${filteredRecords.length.toLocaleString()}</span>
          </div>
          <div class="table-container">
            <table class="records-table">
              <thead>
                <tr>
                  <th>State</th><th>County</th><th>Owner</th><th>Country</th><th>Acres</th><th>Score</th><th>Flags</th><th>Reasons</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map(r => `
                  <tr>
                    <td>${r.state || '—'}</td>
                    <td>${r.county || '—'}</td>
                    <td class="owner-cell">${r.owner_name || '—'}</td>
                    <td>${r.country || '—'}</td>
                    <td>${r.acres ? r.acres.toLocaleString() : '—'}</td>
                    <td>${r.risk_score != null ? r.risk_score : '—'}</td>
                    <td class="flags-cell">${r.has_hard_flag ? 'HARD' : ''}${r.flag_adversary_nation ? ' ADV' : ''}${r.flag_ambiguity ? ' AMB' : ''}${r.flag_trust_beneficiary ? ' TRST' : ''}</td>
                    <td class="reasons-cell">${(r.top_reason_codes || '').split(',').slice(0,3).join(' ')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="audit-footer">
          <div class="audit-item"><span class="audit-label">Source File:</span><span class="audit-value">afida_current_holdings_yr2024_clean.csv</span></div>
          <div class="audit-item"><span class="audit-label">Pipeline Hash:</span><span class="audit-value">${PIPELINE_HASH}</span></div>
          <div class="audit-item"><span class="audit-label">Total Records:</span><span class="audit-value">${RECORD_COUNT}</span></div>
          <div class="audit-item"><span class="audit-label">Flagged Records:</span><span class="audit-value">${FLAG_COUNT}</span></div>
        </div>
      </div>
    `;
  }

  function attachHandlers() {
    document.getElementById('export-btn')?.addEventListener('click', () => {
      const headers = ['state','county','owner_name','country','acres','risk_score','risk_tier','has_hard_flag','top_reason_codes'];
      const csv = [headers.join(','), ...filteredRecords.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g,'""')}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `afida_${tier.toLowerCase()}_parcels.csv`;
      a.click();
    });
  }

  main.innerHTML = buildHTML();
  attachHandlers();
}

renderApp();
