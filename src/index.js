const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const COUNTRY_EXPOSURE = [
  { country: 'GIBRALTAR', acres: 478, value: 0 },
  { country: 'GREECE', acres: 57590, value: 0 },
  { country: 'GUATEMALA', acres: 41, value: 0 },
  { country: 'HONDURAS', acres: 45, value: 224870 },
  { country: 'HONG KONG', acres: 8465.1, value: 0 },
  { country: 'INDIA', acres: 1613.7, value: 723000 },
  { country: 'INDONESIA', acres: 5583.7, value: 0 },
  { country: 'IRAN (ISLAMIC REPUBLIC OF)', acres: 217, value: 0 },
  { country: 'IRELAND', acres: 75837, value: 31000556 },
  { country: 'ISRAEL', acres: 1402.9, value: 537326.02 },
  { country: 'ITALY', acres: 239533.5, value: 161543280.26 },
  { country: 'JAPAN', acres: 16700.8, value: 12086450 },
  { country: 'JORDAN', acres: 237, value: 0 },
  { country: 'KENYA', acres: 91, value: 0 },
  { country: 'KOREA, REPUBLIC OF', acres: 2184.9, value: 1991250 },
  { country: 'KUWAIT', acres: 19783, value: 6394000 },
  { country: 'LEBANON', acres: 2699, value: 923000 },
  { country: 'LIBERIA', acres: 709, value: 0 },
  { country: 'LIECHTENSTEIN', acres: 38982.1, value: 0 },
  { country: 'LUXEMBOURG', acres: 53325.6, value: 1936910 },
  { country: 'MALAYSIA', acres: 2567.3, value: 0 },
  { country: 'MEXICO', acres: 288445.3, value: 24724311 },
  { country: 'NAMIBIA', acres: 106, value: 0 },
  { country: 'NEPAL', acres: 68, value: 0 },
  { country: 'NETHERLANDS', acres: 484388.4, value: 64015027 },
  { country: 'NEW ZEALAND', acres: 16232.6, value: 2936000 },
  { country: 'NICARAGUA', acres: 1200, value: 0 },
  { country: 'PANAMA', acres: 25647, value: 6362000 },
  { country: 'PHILIPPINES', acres: 6290.2, value: 0 },
  { country: 'PORTUGAL', acres: 145863.6, value: 93632197.68 },
  { country: 'SAUDI ARABIA', acres: 3140, value: 11343000 },
  { country: 'SINGAPORE', acres: 32782.6, value: 132256616.91 },
  { country: 'SOUTH AFRICA', acres: 8456, value: 0 },
  { country: 'SPAIN', acres: 41917.9, value: 22441105.66 },
  { country: 'SWEDEN', acres: 367540.1, value: 1779000 },
  { country: 'SWITZERLAND', acres: 187701.3, value: 73868548 },
  { country: 'SYRIAN ARAB REPUBLIC', acres: 1973, value: 0 },
  { country: 'TAIWAN, PROVINCE OF CHINA', acres: 27573, value: 0 },
  { country: 'TURKEY', acres: 443.2, value: 0 },
  { country: 'UNITED KINGDOM', acres: 164979.7, value: 105841131.72 },
  { country: 'URUGUAY', acres: 22618.5, value: 0 },
  { country: 'VENEZUELA', acres: 1047, value: 122000 },
  { country: 'VIETNAM', acres: 152, value: 0 },
  { country: 'VIRGIN ISLANDS (BRITISH)', acres: 43245.1, value: 21516000 },
];

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
];

const US_COUNTIES = [
  { name: 'Maricopa County', state: 'AZ' }, { name: 'Pima County', state: 'AZ' },
  { name: 'Los Angeles County', state: 'CA' }, { name: 'San Diego County', state: 'CA' },
  { name: 'Miami-Dade County', state: 'FL' }, { name: 'Broward County', state: 'FL' },
  { name: 'Fulton County', state: 'GA' }, { name: 'Cook County', state: 'IL' },
  { name: 'Harris County', state: 'TX' }, { name: 'Dallas County', state: 'TX' },
  { name: 'King County', state: 'WA' }, { name: 'Fairfax County', state: 'VA' },
];

function initRegionPicker() {
  const picker = document.getElementById('region-picker');
  const tagsContainer = document.getElementById('region-tags');
  const searchInput = document.getElementById('region-search');
  const dropdown = document.getElementById('region-dropdown');
  const optionsList = document.getElementById('region-options');
  const hiddenInput = document.getElementById('states');
  const tabs = document.querySelectorAll('.region-tab');

  let selected = [];
  let currentScope = 'states';
  let query = '';

  function getItems() {
    if (currentScope === 'states') {
      return US_STATES
        .filter(s => !query || s.name.toLowerCase().includes(query) || s.code.toLowerCase().includes(query))
        .map(s => ({ id: s.code, label: s.name, badge: s.code }));
    }
    return US_COUNTIES
      .filter(c => !query || c.name.toLowerCase().includes(query) || c.state.toLowerCase().includes(query))
      .map(c => ({ id: `${c.name}, ${c.state}`, label: c.name, badge: c.state }));
  }

  function renderOptions() {
    const items = getItems();
    if (!items.length) {
      optionsList.innerHTML = `<div class="region-no-results">No results for "${query}"</div>`;
      return;
    }
    optionsList.innerHTML = items.map(item => {
      const sel = selected.includes(item.id);
      return `<div class="region-option${sel ? ' selected' : ''}" data-id="${item.id}">
        <span>${item.label}</span>
        <span class="region-opt-badge">${item.badge}</span>
      </div>`;
    }).join('');
    optionsList.querySelectorAll('.region-option').forEach(el => {
      el.addEventListener('mousedown', e => {
        e.preventDefault();
        const id = el.dataset.id;
        if (selected.includes(id)) {
          selected = selected.filter(s => s !== id);
        } else {
          selected.push(id);
        }
        syncHidden();
        renderTags();
        renderOptions();
        searchInput.focus();
      });
    });
  }

  function renderTags() {
    tagsContainer.querySelectorAll('.region-tag').forEach(t => t.remove());
    selected.forEach(id => {
      const tag = document.createElement('span');
      tag.className = 'region-tag';
      tag.innerHTML = `${id}<button type="button" aria-label="Remove ${id}">&times;</button>`;
      tag.querySelector('button').addEventListener('click', () => {
        selected = selected.filter(s => s !== id);
        syncHidden();
        renderTags();
        renderOptions();
      });
      tagsContainer.insertBefore(tag, searchInput);
    });
  }

  function syncHidden() {
    hiddenInput.value = selected.join('; ');
  }

  searchInput.addEventListener('focus', () => {
    dropdown.hidden = false;
    renderOptions();
  });

  searchInput.addEventListener('blur', () => {
    setTimeout(() => { dropdown.hidden = true; }, 150);
  });

  searchInput.addEventListener('input', () => {
    query = searchInput.value.toLowerCase().trim();
    renderOptions();
  });

  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Escape') { dropdown.hidden = true; searchInput.blur(); }
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentScope = tab.dataset.scope;
      renderOptions();
    });
  });

  tagsContainer.addEventListener('click', () => searchInput.focus());
}

function initCountryExposureTable() {
  const tbody = document.getElementById('ce-tbody');
  const searchInput = document.getElementById('ce-search');
  const toggleBtns = document.querySelectorAll('.ce-toggle');
  const headers = document.querySelectorAll('#ce-table th.sortable');
  if (!tbody) return;

  let sortCol = 'acres';
  let sortDir = 'desc';
  let filterMode = 'all';
  let query = '';

  const maxAcres = Math.max(...COUNTRY_EXPOSURE.map(r => r.acres));

  function fmt(n) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  }
  function fmtUSD(n) {
    if (n === 0) return '<span class="ce-value-zero">—</span>';
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function render() {
    let rows = [...COUNTRY_EXPOSURE];
    if (query) {
      rows = rows.filter(r => r.country.toLowerCase().includes(query));
    }
    if (filterMode === 'value') {
      rows = rows.filter(r => r.value > 0);
    }
    rows.sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (sortCol === 'country') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      if (sortCol === 'rank') { va = a.acres; vb = b.acres; }
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

    tbody.innerHTML = rows.map((r, i) => {
      const barPct = Math.round((r.acres / maxAcres) * 100);
      return `<tr>
        <td>${i + 1}</td>
        <td><span class="ce-country-name">${r.country}</span></td>
        <td class="ce-acres">
          <div style="display:flex;align-items:center;gap:10px;">
            <span>${fmt(r.acres)}</span>
            <div class="ce-bar-wrap" style="width:90px;"><div class="ce-bar" style="width:${barPct}%"></div></div>
          </div>
        </td>
        <td class="ce-value">${fmtUSD(r.value)}</td>
      </tr>`;
    }).join('');

    headers.forEach(h => {
      h.classList.remove('sorted-asc', 'sorted-desc');
      const col = h.dataset.col;
      if (col === sortCol || (col === 'rank' && sortCol === 'acres')) {
        h.classList.add(sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc');
      }
    });
  }

  headers.forEach(h => {
    h.addEventListener('click', () => {
      let col = h.dataset.col;
      if (col === 'rank') col = 'acres';
      if (sortCol === col) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        sortCol = col;
        sortDir = col === 'country' ? 'asc' : 'desc';
      }
      render();
    });
  });

  searchInput.addEventListener('input', () => {
    query = searchInput.value.toLowerCase().trim();
    render();
  });

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterMode = btn.dataset.filter;
      render();
    });
  });

  render();
}

document.addEventListener('DOMContentLoaded', () => {
  initRegionPicker();
  initCountryExposureTable();

  const btn = document.getElementById('contact-submit-btn');
  const feedback = document.getElementById('contact-feedback');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const org = document.getElementById('org').value;
    const use_case = document.getElementById('use').value;
    const states = document.getElementById('states').value;
    const notes = document.getElementById('note').value;
    const email = document.getElementById('email').value;

    btn.disabled = true;
    btn.textContent = 'Submitting\u2026';
    feedback.style.display = 'none';

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/contact-form`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org, use_case, states, notes, email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        feedback.style.display = 'block';
        feedback.style.color = '#4ade80';
        feedback.textContent = 'Submitted. We will follow up within 2 business days.';
        document.getElementById('states').value = '';
        document.getElementById('region-tags').querySelectorAll('.region-tag').forEach(t => t.remove());
        document.getElementById('region-search').value = '';
        document.getElementById('note').value = '';
        document.getElementById('email').value = '';
      } else {
        throw new Error(data.error || 'Submission failed');
      }
    } catch {
      feedback.style.display = 'block';
      feedback.style.color = '#f87171';
      feedback.textContent = 'Submission failed. Please try again or email us directly.';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Request Technical Brief';
    }
  });
});
