import '../src/geo-map-style.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.markercluster';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TIER_COLORS = {
  CRITICAL: '#FF2222',
  HIGH: '#FF8C00',
  MEDIUM: '#FFD700',
  LOW: '#4FC3F7',
  NONE: '#2E4A2E',
};

const TIER_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'];

const STATE_CENTERS = {
  AL:[32.7,-86.7],AK:[64.2,-153.4],AZ:[34.3,-111.1],AR:[34.8,-92.2],
  CA:[36.8,-119.4],CO:[39.0,-105.5],CT:[41.6,-72.7],DE:[39.0,-75.5],
  FL:[27.9,-81.7],GA:[32.2,-83.4],HI:[20.8,-157.0],ID:[44.4,-114.6],
  IL:[40.0,-89.2],IN:[39.9,-86.3],IA:[42.0,-93.2],KS:[38.5,-96.5],
  KY:[37.7,-84.9],LA:[31.2,-91.8],ME:[45.4,-69.0],MD:[39.1,-76.8],
  MA:[42.2,-71.5],MI:[44.3,-84.5],MN:[46.4,-93.1],MS:[32.7,-89.7],
  MO:[38.5,-92.3],MT:[46.9,-110.4],NE:[41.5,-99.9],NV:[39.3,-116.6],
  NH:[43.9,-71.6],NJ:[40.1,-74.5],NM:[34.8,-106.2],NY:[42.2,-74.9],
  NC:[35.6,-79.8],ND:[47.5,-100.5],OH:[40.4,-82.8],OK:[35.6,-96.9],
  OR:[44.1,-120.5],PA:[40.6,-77.2],RI:[41.7,-71.5],SC:[33.9,-80.9],
  SD:[44.4,-100.2],TN:[35.9,-86.7],TX:[31.5,-99.3],UT:[39.3,-111.1],
  VT:[44.1,-72.7],VA:[37.8,-78.2],WA:[47.4,-120.4],WV:[38.9,-80.4],
  WI:[44.3,-89.6],WY:[43.0,-107.6],DC:[38.9,-77.0],
};

const STATE_FIPS = {
  AL:'01',AK:'02',AZ:'04',AR:'05',CA:'06',CO:'08',CT:'09',DE:'10',
  FL:'12',GA:'13',HI:'15',ID:'16',IL:'17',IN:'18',IA:'19',KS:'20',
  KY:'21',LA:'22',ME:'23',MD:'24',MA:'25',MI:'26',MN:'27',MS:'28',
  MO:'29',MT:'30',NE:'31',NV:'32',NH:'33',NJ:'34',NM:'35',NY:'36',
  NC:'37',ND:'38',OH:'39',OK:'40',OR:'41',PA:'42',RI:'44',SC:'45',
  SD:'46',TN:'47',TX:'48',UT:'49',VT:'50',VA:'51',WA:'53',WV:'54',
  WI:'55',WY:'56',DC:'11',
};

const STATE_ABBR = {
  'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA',
  'Colorado':'CO','Connecticut':'CT','Delaware':'DE','Florida':'FL','Georgia':'GA',
  'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA','Kansas':'KS',
  'Kentucky':'KY','Louisiana':'LA','Maine':'ME','Maryland':'MD','Massachusetts':'MA',
  'Michigan':'MI','Minnesota':'MN','Mississippi':'MS','Missouri':'MO','Montana':'MT',
  'Nebraska':'NE','Nevada':'NV','New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM',
  'New York':'NY','North Carolina':'NC','North Dakota':'ND','Ohio':'OH','Oklahoma':'OK',
  'Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC',
  'South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT',
  'Virginia':'VA','Washington':'WA','West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY',
  'District of Columbia':'DC',
};

let map = null;
let markerLayer = null;
let choroLayer = null;
let militaryLayer = null;
let countyData = [];
let allParcels = [];
let countyGeoJson = null;
let shadeMode = 'tier';
let showMilitary = false;
let selectedCountry = '';
let selectedState = '';
let headlineStats = { states: 19, counties: 955, parcels: 16787, acreage: 16110000 };

async function fetchHeadlineStats() {
  const { data } = await supabase
    .from('flagged_parcels')
    .select('state,county,acres', { count: 'exact' });

  if (data) {
    const states = new Set(data.map(r => r.state)).size;
    const counties = new Set(data.map(r => (r.county || '') + '|' + (r.state || ''))).size;
    const parcels = data.length;
    const acreage = data.reduce((s, r) => s + (parseFloat(r.acres) || 0), 0);
    headlineStats = { states, counties, parcels, acreage };
    document.getElementById('stat-states').textContent = states.toLocaleString();
    document.getElementById('stat-counties').textContent = counties.toLocaleString();
    document.getElementById('stat-parcels').textContent = parcels.toLocaleString();
    document.getElementById('stat-acreage').textContent = (acreage / 1e6).toFixed(2) + 'M';
  }
}

async function fetchCountries() {
  const { data } = await supabase.rpc('get_distinct_countries');
  if (!data) return [];
  return data.map(r => r.country).filter(Boolean);
}

async function initMap() {
  document.getElementById('app').innerHTML = `
    <nav class="navbar">
      <div class="nav-container">
        <a href="/" class="logo">AFIDA Intelligence</a>
        <div class="nav-links">
          <a href="/" class="nav-link">Home</a>
          <a href="/map.html" class="nav-link">Analysis</a>
          <a href="/geo-map.html" class="nav-link active">Map</a>
          <a href="/checkout.html" class="nav-link">Pricing</a>
          <a href="/" class="nav-link">My Account</a>
        </div>
      </div>
    </nav>

    <div class="map-filter-bar">
      <div class="filter-bar-inner">
        <div class="filter-group">
          <div class="filter-label">SELECT A COUNTRY</div>
          <div class="custom-select-wrapper">
            <select class="filter-select" id="country-select">
              <option value="">No countries selected</option>
            </select>
          </div>
        </div>
        <div class="filter-group">
          <div class="filter-label">SELECT A STATE</div>
          <div class="custom-select-wrapper">
            <select class="filter-select" id="state-select">
              <option value="">All States</option>
            </select>
          </div>
        </div>
        <div class="filter-group filter-group-stats">
          <div class="headline-stats">
            <div class="headline-stat">
              <div class="headline-number" id="stat-states">${headlineStats.states.toLocaleString()}</div>
              <div class="headline-label"># OF STATES</div>
            </div>
            <div class="headline-divider"></div>
            <div class="headline-stat">
              <div class="headline-number" id="stat-counties">${headlineStats.counties.toLocaleString()}</div>
              <div class="headline-label"># OF COUNTIES</div>
            </div>
            <div class="headline-divider"></div>
            <div class="headline-stat">
              <div class="headline-number" id="stat-parcels">${headlineStats.parcels.toLocaleString()}</div>
              <div class="headline-label"># OF PARCELS</div>
            </div>
            <div class="headline-divider"></div>
            <div class="headline-stat">
              <div class="headline-number" id="stat-acreage">16.11M</div>
              <div class="headline-label">TOTAL ACREAGE</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="geo-map-container">
      <div class="map-sidebar">
        <div class="sidebar-section">
          <div class="view-mode-label">View Mode</div>
          <div class="dataset-badge">DATASET: AFIDA 2024</div>
        </div>

        <div class="sidebar-tabs-row">
          <button class="sidebar-tab active" id="tab-county">COUNTY SHADING</button>
          <button class="sidebar-tab" id="tab-parcel">PARCEL MARKERS</button>
        </div>

        <div id="panel-county" class="sidebar-panel">
          <div class="sidebar-section">
            <div class="section-title">SHADE COUNTIES BY</div>
            <div class="shade-options">
              <label class="shade-option">
                <input type="radio" name="shade" value="tier" checked />
                <span>Dominant Risk Tier</span>
              </label>
              <label class="shade-option">
                <input type="radio" name="shade" value="acreage" />
                <span>Total Acreage</span>
              </label>
              <label class="shade-option">
                <input type="radio" name="shade" value="count" />
                <span>Parcel Count</span>
              </label>
            </div>
          </div>

          <div class="sidebar-section">
            <div class="section-title">THREAT LEGEND</div>
            <div id="county-legend" class="choropleth-legend">
              <div class="legend-row"><span class="legend-swatch" style="background:#FF2222"></span>Critical</div>
              <div class="legend-row"><span class="legend-swatch" style="background:#FF8C00"></span>High</div>
              <div class="legend-row"><span class="legend-swatch" style="background:#FFD700"></span>Medium</div>
              <div class="legend-row"><span class="legend-swatch" style="background:#4FC3F7"></span>Low</div>
              <div class="legend-row"><span class="legend-swatch" style="background:#2E4A2E;border:1px solid #3D6B3D"></span>None</div>
              <div class="legend-row"><span class="legend-swatch" style="background:#1A2A1A;border:1px solid #2E4A2E"></span>No Data</div>
            </div>
          </div>

          <div class="sidebar-section county-count-section">
            <div class="county-count-number" id="county-count">2,560</div>
            <div class="county-count-label">COUNTIES WITH DATA</div>
          </div>
        </div>

        <div id="panel-parcel" class="sidebar-panel hidden">
          <div class="sidebar-section">
            <div class="section-title">PARCEL MARKERS</div>
            <div class="shade-options">
              ${['CRITICAL','HIGH','MEDIUM','LOW','NONE'].map(tier => `
                <label class="shade-option tier-toggle-label">
                  <input type="checkbox" class="tier-toggle" data-tier="${tier}" checked />
                  <span class="tier-dot" style="background:${TIER_COLORS[tier]};border:1px solid rgba(255,255,255,0.2)"></span>
                  <span>${tier}</span>
                </label>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="sidebar-bottom">
          <button class="btn-reset" id="btn-reset">Reset View</button>
          <button class="btn-military ${showMilitary ? 'active' : ''}" id="btn-military">Military Installations</button>
        </div>
      </div>

      <div class="map-main">
        <div class="map-loading" id="map-loading">Loading map data...</div>
        <div id="map"></div>
      </div>
    </div>
  `;

  map = L.map('map', { zoomControl: true }).setView([38.5, -96], 4);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO',
    maxZoom: 19,
  }).addTo(map);

  markerLayer = L.markerClusterGroup({
    chunkedLoading: true,
    maxClusterRadius: 40,
    iconCreateFunction: (cluster) => {
      const markers = cluster.getAllChildMarkers();
      const hasCritical = markers.some(m => m.options.tier === 'CRITICAL');
      const hasHigh = markers.some(m => m.options.tier === 'HIGH');
      const cls = hasCritical ? 'cluster-critical' : hasHigh ? 'cluster-high' : 'cluster-default';
      return L.divIcon({
        html: `<div class="cluster-inner"><span>${cluster.getChildCount()}</span></div>`,
        className: `marker-cluster ${cls}`,
        iconSize: L.point(40, 40),
      });
    },
  });

  await Promise.all([
    loadCountyData(),
    populateCountrySelect(),
  ]);
  populateStateSelect();

  fetchHeadlineStats();
  setupEventHandlers();
}

async function loadCountyData() {
  const PAGE = 1000;
  let allData = [];
  let page = 0;

  while (true) {
    const { data, error } = await supabase
      .from('county_risk_summary')
      .select('state,county,county_fips,dominant_tier,total_acres,record_count')
      .range(page * PAGE, (page + 1) * PAGE - 1);

    if (error) {
      document.getElementById('map-loading').textContent = 'Error loading county data';
      return;
    }

    allData = allData.concat(data || []);
    if (!data || data.length < PAGE) break;
    page++;
  }

  countyData = allData;
  document.getElementById('county-count').textContent = countyData.length.toLocaleString();

  await loadGeoJson();
}

async function loadGeoJson() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json');
    countyGeoJson = await res.json();
    renderChoropleth();
    document.getElementById('map-loading').style.display = 'none';
  } catch {
    renderFallbackMarkers();
    document.getElementById('map-loading').style.display = 'none';
  }
}

function getCountyColor(fips) {
  const county = countyData.find(c => c.county_fips === fips);
  if (!county) return null;

  if (shadeMode === 'tier') {
    return TIER_COLORS[county.dominant_tier] || '#e2e8f0';
  }
  if (shadeMode === 'acreage') {
    const maxAcres = Math.max(...countyData.map(c => parseFloat(c.total_acres) || 0));
    const val = (parseFloat(county.total_acres) || 0) / maxAcres;
    return acreageColor(val);
  }
  if (shadeMode === 'count') {
    const maxCount = Math.max(...countyData.map(c => c.record_count || 0));
    const val = (county.record_count || 0) / maxCount;
    return countColor(val);
  }
  return '#e2e8f0';
}

function acreageColor(t) {
  if (t > 0.75) return '#FFD700';
  if (t > 0.5) return '#8BC34A';
  if (t > 0.25) return '#4CAF50';
  if (t > 0.05) return '#2E7D32';
  return '#1B5E20';
}

function countColor(t) {
  if (t > 0.75) return '#FFD700';
  if (t > 0.5) return '#8BC34A';
  if (t > 0.25) return '#4CAF50';
  if (t > 0.05) return '#2E7D32';
  return '#1B5E20';
}

function renderChoropleth() {
  if (choroLayer) { map.removeLayer(choroLayer); choroLayer = null; }
  if (!countyGeoJson) return;

  let filteredFeatures = countyGeoJson.features;
  if (selectedState) {
    const selectedAbbr = STATE_ABBR[selectedState] || selectedState;
    const stateFipsPrefix = STATE_FIPS[selectedAbbr];
    filteredFeatures = filteredFeatures.filter(f => {
      const fips = f.id || (f.properties?.STATE + f.properties?.COUNTY);
      return stateFipsPrefix ? String(fips).startsWith(stateFipsPrefix) : false;
    });
  }

  choroLayer = L.geoJSON({ type: 'FeatureCollection', features: filteredFeatures }, {
    style: (feature) => {
      const fips = feature.id || (feature.properties?.STATE + feature.properties?.COUNTY);
      const color = getCountyColor(fips);
      if (!color) {
        return { fillColor: '#1A2A1A', weight: 0.5, color: 'rgba(100,180,100,0.15)', fillOpacity: 0.55 };
      }
      return {
        fillColor: color,
        weight: 0.6,
        color: 'rgba(0,0,0,0.6)',
        fillOpacity: 0.80,
      };
    },
    onEachFeature: (feature, layer) => {
      const fips = feature.id || (feature.properties?.STATE + feature.properties?.COUNTY);
      const county = countyData.find(c => c.county_fips === fips);
      if (county) {
        layer.bindPopup(`
          <div class="marker-popup">
            <div class="popup-header tier-${(county.dominant_tier || '').toLowerCase()}" style="background:${TIER_COLORS[county.dominant_tier] || '#64748b'}">
              ${county.dominant_tier || 'UNKNOWN'} RISK
            </div>
            <div class="popup-content">
              <div class="popup-row"><span class="popup-label">County:</span><span class="popup-value">${county.county}</span></div>
              <div class="popup-row"><span class="popup-label">State:</span><span class="popup-value">${county.state}</span></div>
              <div class="popup-row"><span class="popup-label">Parcels:</span><span class="popup-value">${(county.record_count || 0).toLocaleString()}</span></div>
              <div class="popup-row"><span class="popup-label">Acres:</span><span class="popup-value">${county.total_acres ? parseFloat(county.total_acres).toLocaleString(undefined, {maximumFractionDigits:0}) : '\u2014'}</span></div>
            </div>
          </div>
        `);
        layer.on('mouseover', function() { this.setStyle({ weight: 2, color: '#00FF88', fillOpacity: 0.95 }); });
        layer.on('mouseout', function() { choroLayer && choroLayer.resetStyle(this); });
      }
    },
  });

  choroLayer.addTo(map);
  updateChoroplethLegend();
}

function updateChoroplethLegend() {
  const el = document.getElementById('county-legend');
  if (!el) return;
  if (shadeMode === 'tier') {
    el.innerHTML = `
      <div class="legend-row"><span class="legend-swatch" style="background:#FF2222"></span>Critical</div>
      <div class="legend-row"><span class="legend-swatch" style="background:#FF8C00"></span>High</div>
      <div class="legend-row"><span class="legend-swatch" style="background:#FFD700"></span>Medium</div>
      <div class="legend-row"><span class="legend-swatch" style="background:#4FC3F7"></span>Low</div>
      <div class="legend-row"><span class="legend-swatch" style="background:#2E4A2E;border:1px solid #3D6B3D"></span>None</div>
      <div class="legend-row"><span class="legend-swatch" style="background:#1A2A1A;border:1px solid #2E4A2E"></span>No Data</div>
    `;
  } else {
    el.innerHTML = `
      <div class="legend-row"><span class="legend-swatch" style="background:#FFD700"></span>Very High</div>
      <div class="legend-row"><span class="legend-swatch" style="background:#8BC34A"></span>High</div>
      <div class="legend-row"><span class="legend-swatch" style="background:#4CAF50"></span>Medium</div>
      <div class="legend-row"><span class="legend-swatch" style="background:#2E7D32"></span>Low</div>
      <div class="legend-row"><span class="legend-swatch" style="background:#1B5E20;border:1px solid #2E7D32"></span>Minimal</div>
    `;
  }
}

function renderFallbackMarkers() {
  countyData.forEach(county => {
    const abbr = getStateAbbr(county.state);
    const center = STATE_CENTERS[abbr];
    if (!center) return;
    const jitter = [(Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3];
    const color = TIER_COLORS[county.dominant_tier] || '#e2e8f0';
    L.circleMarker([center[0] + jitter[0], center[1] + jitter[1]], {
      radius: 6, fillColor: color, color: 'white', weight: 1, fillOpacity: 0.8,
    }).addTo(map);
  });
}

async function loadParcels() {
  document.getElementById('map-loading').style.display = 'block';
  document.getElementById('map-loading').textContent = 'Loading parcels...';

  let query = supabase
    .from('flagged_parcels')
    .select('id,state,county,owner_name,country,acres,risk_score,risk_tier,has_hard_flag,top_reason_codes')
    .limit(3000);

  if (selectedState) query = query.eq('state', Object.entries(STATE_ABBR).find(([,v]) => v === selectedState)?.[0] || selectedState);
  if (selectedCountry) query = query.eq('country', selectedCountry);

  const { data, error } = await query;
  if (error || !data) {
    document.getElementById('map-loading').style.display = 'none';
    return;
  }

  allParcels = data;
  renderParcelMarkers();
  document.getElementById('map-loading').style.display = 'none';
}

function getActiveTiers() {
  const checked = document.querySelectorAll('.tier-toggle:checked');
  return new Set([...checked].map(c => c.dataset.tier));
}

function renderParcelMarkers() {
  markerLayer.clearLayers();
  if (!map.hasLayer(markerLayer)) map.addLayer(markerLayer);

  const activeTiers = getActiveTiers();
  const visible = allParcels.filter(p => activeTiers.has(p.risk_tier));

  visible.forEach(parcel => {
    const abbr = getStateAbbr(parcel.state) || parcel.state;
    const coords = STATE_CENTERS[abbr];
    if (!coords) return;

    const jitter = [(Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2];
    const lat = coords[0] + jitter[0];
    const lng = coords[1] + jitter[1];

    const icon = L.divIcon({
      className: '',
      html: buildParcelIcon(parcel.risk_tier),
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    const marker = L.marker([lat, lng], { icon, tier: parcel.risk_tier });
    marker.bindPopup(`
      <div class="marker-popup">
        <div class="popup-header" style="background:${TIER_COLORS[parcel.risk_tier] || '#64748b'}">${parcel.risk_tier || 'UNKNOWN'}</div>
        <div class="popup-content">
          <div class="popup-row"><span class="popup-label">Owner:</span><span class="popup-value">${parcel.owner_name || '\u2014'}</span></div>
          <div class="popup-row"><span class="popup-label">Country:</span><span class="popup-value">${parcel.country || '\u2014'}</span></div>
          <div class="popup-row"><span class="popup-label">State:</span><span class="popup-value">${parcel.state || '\u2014'}</span></div>
          <div class="popup-row"><span class="popup-label">County:</span><span class="popup-value">${parcel.county || '\u2014'}</span></div>
          <div class="popup-row"><span class="popup-label">Acres:</span><span class="popup-value">${parcel.acres ? parseFloat(parcel.acres).toLocaleString() : '\u2014'}</span></div>
          <div class="popup-row"><span class="popup-label">Score:</span><span class="popup-value">${parcel.risk_score != null ? parcel.risk_score : '\u2014'}</span></div>
          ${parcel.top_reason_codes ? `<div class="popup-section-title">Reason Codes</div><div class="popup-row"><span class="popup-value">${parcel.top_reason_codes}</span></div>` : ''}
          <div class="popup-disclaimer">Coordinates are state-centroid approximations.</div>
        </div>
      </div>
    `);
    markerLayer.addLayer(marker);
  });
}

function buildParcelIcon(tier) {
  const color = TIER_COLORS[tier] || '#64748b';
  return `<svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="8" width="20" height="13" rx="2" fill="${color}" stroke="white" stroke-width="1.5"/>
    <polygon points="11,1 1,8 21,8" fill="${color}" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
    <rect x="7" y="13" width="8" height="8" rx="1" fill="white" opacity="0.35"/>
  </svg>`;
}

async function populateCountrySelect() {
  const countries = await fetchCountries();
  const sel = document.getElementById('country-select');
  countries.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  });
}

function populateStateSelect() {
  const sel = document.getElementById('state-select');
  sel.innerHTML = '<option value="">All States</option>';
  sel.disabled = false;
  Object.keys(STATE_ABBR).sort().forEach(fullName => {
    const opt = document.createElement('option');
    opt.value = fullName;
    opt.textContent = fullName;
    sel.appendChild(opt);
  });
}

function getStateAbbr(stateName) {
  if (!stateName) return '';
  if (STATE_ABBR[stateName]) return STATE_ABBR[stateName];
  if (STATE_CENTERS[stateName]) return stateName;
  return stateName;
}

async function loadMilitary() {
  if (militaryLayer) { map.removeLayer(militaryLayer); militaryLayer = null; }
  if (!showMilitary) return;

  const { data } = await supabase
    .from('military_installations')
    .select('installation_name,branch,state,latitude,longitude,type')
    .limit(500);

  if (!data) return;

  militaryLayer = L.layerGroup();
  data.forEach(inst => {
    if (!inst.latitude || !inst.longitude) return;
    const icon = L.divIcon({
      className: 'military-installation-marker',
      html: `<svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="20" height="20" rx="3" fill="#0D2E0D" stroke="#4CAF50" stroke-width="1.5"/>
        <polygon points="11,4 14,9 18,9 15,13 16,18 11,15 6,18 7,13 4,9 8,9" fill="#4CAF50"/>
      </svg>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    L.marker([inst.latitude, inst.longitude], { icon })
      .bindPopup(`
        <div class="marker-popup">
          <div class="popup-header" style="background:#0D3B0D;border-bottom:1px solid #4CAF50">MILITARY INSTALLATION</div>
          <div class="popup-content">
            <div class="popup-row"><span class="popup-label">Name:</span><span class="popup-value">${inst.installation_name || '\u2014'}</span></div>
            <div class="popup-row"><span class="popup-label">Branch:</span><span class="popup-value">${inst.branch || '\u2014'}</span></div>
            <div class="popup-row"><span class="popup-label">State:</span><span class="popup-value">${inst.state || '\u2014'}</span></div>
            <div class="popup-row"><span class="popup-label">Type:</span><span class="popup-value">${inst.type || '\u2014'}</span></div>
          </div>
        </div>
      `)
      .addTo(militaryLayer);
  });

  map.addLayer(militaryLayer);
}

function setupEventHandlers() {
  document.getElementById('country-select')?.addEventListener('change', async (e) => {
    selectedCountry = e.target.value;
    selectedState = '';
    const stateSel = document.getElementById('state-select');
    if (stateSel) stateSel.value = '';

    const activeTab = document.getElementById('tab-parcel').classList.contains('active');
    if (activeTab) {
      await loadParcels();
    } else {
      renderChoropleth();
    }
  });

  document.getElementById('state-select')?.addEventListener('change', async (e) => {
    selectedState = e.target.value;
    const activeTab = document.getElementById('tab-parcel').classList.contains('active');
    if (activeTab) {
      await loadParcels();
    } else {
      renderChoropleth();
    }
    const abbr = STATE_ABBR[selectedState] || selectedState;
    if (selectedState && STATE_CENTERS[abbr]) {
      map.setView(STATE_CENTERS[abbr], 6);
    } else {
      map.setView([38.5, -96], 4);
    }
  });

  document.querySelectorAll('input[name="shade"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      shadeMode = e.target.value;
      renderChoropleth();
    });
  });

  document.getElementById('tab-county')?.addEventListener('click', () => {
    document.getElementById('tab-county').classList.add('active');
    document.getElementById('tab-parcel').classList.remove('active');
    document.getElementById('panel-county').classList.remove('hidden');
    document.getElementById('panel-parcel').classList.add('hidden');

    if (map.hasLayer(markerLayer)) map.removeLayer(markerLayer);
    renderChoropleth();
  });

  document.getElementById('tab-parcel')?.addEventListener('click', async () => {
    document.getElementById('tab-parcel').classList.add('active');
    document.getElementById('tab-county').classList.remove('active');
    document.getElementById('panel-parcel').classList.remove('hidden');
    document.getElementById('panel-county').classList.add('hidden');

    if (choroLayer) { map.removeLayer(choroLayer); choroLayer = null; }
    await loadParcels();
  });

  document.querySelectorAll('.tier-toggle').forEach(cb => {
    cb.addEventListener('change', renderParcelMarkers);
  });

  document.getElementById('btn-reset')?.addEventListener('click', () => {
    selectedCountry = '';
    selectedState = '';
    const cSel = document.getElementById('country-select');
    const sSel = document.getElementById('state-select');
    if (cSel) cSel.value = '';
    if (sSel) sSel.value = '';
    map.setView([38.5, -96], 4);

    const isCountyTab = document.getElementById('tab-county').classList.contains('active');
    if (isCountyTab) {
      renderChoropleth();
    } else {
      allParcels = [];
      if (markerLayer) markerLayer.clearLayers();
    }
  });

  document.getElementById('btn-military')?.addEventListener('click', () => {
    showMilitary = !showMilitary;
    const btn = document.getElementById('btn-military');
    if (showMilitary) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
    loadMilitary();
  });
}

initMap();
