import {
  loadConfig,
  saveConfigToStorage,
  clearConfigStorage,
  getBundledDefaultConfig,
} from '../src/config/configLoader.js';
import { getEnemyDisplayName } from '../src/config/enemyResolver.js';

let config = loadConfig();
let selectedWaveRound = null;
let selectedWaveTrack = Object.keys(config.tracks || {})[0] || 'amazon-office';

const statusEl = document.getElementById('status');

function showStatus(msg) {
  statusEl.textContent = msg;
  statusEl.classList.add('show');
  setTimeout(() => statusEl.classList.remove('show'), 2500);
}

function numInput(value) {
  const input = document.createElement('input');
  input.type = 'number';
  input.step = 'any';
  input.value = value ?? 0;
  return input;
}

function textInput(value) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value ?? '';
  return input;
}

function field(labelText, inputEl) {
  const wrap = document.createElement('div');
  wrap.className = 'field';
  const label = document.createElement('label');
  label.textContent = labelText;
  wrap.appendChild(label);
  wrap.appendChild(inputEl);
  return wrap;
}

function renderConstants() {
  const panel = document.getElementById('tab-constants');
  panel.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'entity-card';
  card.innerHTML = '<h3>Game Constants</h3>';
  const grid = document.createElement('div');
  grid.className = 'field-grid';

  const gc = config.gameConstants;
  const fields = {
    startingCash: numInput(gc.startingCash),
    startingLives: numInput(gc.startingLives),
    totalRounds: numInput(gc.totalRounds),
    playfieldScale: numInput(gc.playfieldScale ?? 1),
    roundScalingFactor: numInput(gc.roundScalingFactor),
    roundCompletionBonus: numInput(gc.roundCompletionBonus),
    gridCellSize: numInput(gc.gridCellSize),
  };

  Object.entries(fields).forEach(([key, input]) => {
    grid.appendChild(field(key, input));
    input.dataset.path = `gameConstants.${key}`;
  });

  card.appendChild(grid);
  panel.appendChild(card);
}

function renderEntities(panelId, entities, statFields, prefix) {
  const panel = document.getElementById(panelId);
  panel.innerHTML = '';

  for (const [id, entity] of Object.entries(entities)) {
    const card = document.createElement('div');
    card.className = 'entity-card';
    card.innerHTML = `<h3>${entity.label || entity.name || id}</h3>`;
    const grid = document.createElement('div');
    grid.className = 'field-grid';

    for (const stat of statFields) {
      if (stat === 'buffPower' && !entity.special && !entity.buffPower) continue;
      if (stat === 'effectMagnitude' && !entity.special?.includes('slow') && entity.id !== 'mikey') continue;
      if (stat === 'effectDuration' && !entity.special?.includes('slow') && entity.id !== 'mikey') continue;
      if (stat === 'healRate' && !entity.healRate) continue;

      const val = entity[stat] ?? 0;
      const input = typeof val === 'boolean' ? textInput(String(val)) : numInput(val);
      input.dataset.path = `${prefix}.${id}.${stat}`;
      grid.appendChild(field(stat, input));
    }

    card.appendChild(grid);
    panel.appendChild(card);
  }
}

function renderProfiles() {
  renderEntities(
    'tab-profiles',
    config.enemyProfiles,
    ['speed', 'health', 'cashReward', 'livesCost', 'healRate'],
    'enemyProfiles'
  );
}

function renderTrackEnemies() {
  const panel = document.getElementById('tab-track-enemies');
  panel.innerHTML = '';

  for (const [trackId, track] of Object.entries(config.tracks || {})) {
    const card = document.createElement('div');
    card.className = 'entity-card';
    card.innerHTML = `<h3>${track.name}</h3>`;
    const grid = document.createElement('div');
    grid.className = 'field-grid';

    const skins = config.trackEnemies?.[trackId] || {};
    for (const [profileType, skin] of Object.entries(skins)) {
      const profile = config.enemyProfiles?.[profileType];
      const heading = document.createElement('div');
      heading.className = 'field field--full';
      heading.innerHTML = `<label>${profile?.label || profileType}</label>`;
      grid.appendChild(heading);

      const nameInput = textInput(skin.name);
      nameInput.dataset.path = `trackEnemies.${trackId}.${profileType}.name`;
      grid.appendChild(field('name', nameInput));

      const colorInput = textInput(skin.color);
      colorInput.dataset.path = `trackEnemies.${trackId}.${profileType}.color`;
      grid.appendChild(field('color', colorInput));
    }

    card.appendChild(grid);
    panel.appendChild(card);
  }
}

function renderHeroes() {
  const panel = document.getElementById('tab-heroes');
  panel.innerHTML = '';

  for (const [id, hero] of Object.entries(config.heroes)) {
    const card = document.createElement('div');
    card.className = 'entity-card';
    card.innerHTML = `<h3>${hero.name}</h3>`;
    const grid = document.createElement('div');
    grid.className = 'field-grid';

    const stats = {
      attackSpeed: numInput(hero.attackSpeed),
      range: numInput(hero.range),
      attackPower: numInput(hero.attackPower),
      accuracy: numInput(hero.accuracy ?? 1),
    };

    for (const [key, input] of Object.entries(stats)) {
      input.dataset.path = `heroes.${id}.${key}`;
      grid.appendChild(field(key, input));
    }

    hero.abilities.forEach((ability, i) => {
      const cd = numInput(ability.cooldown);
      cd.dataset.path = `heroes.${id}.abilities.${i}.cooldown`;
      grid.appendChild(field(`${ability.name} Cooldown`, cd));

      const mag = numInput(ability.effectMagnitude);
      mag.dataset.path = `heroes.${id}.abilities.${i}.effectMagnitude`;
      grid.appendChild(field(`${ability.name} Magnitude`, mag));
    });

    card.appendChild(grid);
    panel.appendChild(card);
  }
}

function getTrackWaves(trackId) {
  if (!config.waves[trackId]) {
    config.waves[trackId] = [];
  }
  return config.waves[trackId];
}

function getWave(trackId, round) {
  return getTrackWaves(trackId).find((w) => w.round === round);
}

function getProfileCount(wave, profileType) {
  const entry = wave.entries.find((e) => e.profileType === profileType);
  return entry ? entry.count : 0;
}

function setProfileCount(wave, profileType, count) {
  const n = Math.max(0, Math.floor(count));
  const idx = wave.entries.findIndex((e) => e.profileType === profileType);
  if (n === 0) {
    if (idx !== -1) wave.entries.splice(idx, 1);
  } else if (idx !== -1) {
    wave.entries[idx].count = n;
  } else {
    wave.entries.push({ profileType, count: n });
  }
}

function getWaveTotal(wave) {
  return wave.entries.reduce((sum, e) => sum + e.count, 0);
}

function formatWaveSummary(wave, trackId) {
  if (!wave.entries.length) {
    return '<span class="wave-summary__empty">No enemies</span>';
  }

  return wave.entries
    .map((e) => {
      const name = getEnemyDisplayName(config, trackId, e.profileType);
      const profile = config.enemyProfiles[e.profileType];
      const bossClass = profile?.isBoss ? ' wave-summary__tag--boss' : '';
      return `<span class="wave-summary__tag${bossClass}">${e.count}× ${name}</span>`;
    })
    .join('');
}

function getProfileMetaLabel(profile) {
  const parts = [];
  if (profile.isBoss) parts.push('Boss');
  if (profile.healRate > 0) parts.push('Heals');
  if (profile.immuneToTowerAbilities) parts.push('Tower-immune');
  return parts.join(' · ') || 'Regular';
}

function renderWaves() {
  if (selectedWaveRound !== null) {
    renderWaveDetail(selectedWaveTrack, selectedWaveRound);
  } else {
    renderWavesList();
  }
}

function renderWavesList() {
  const listView = document.getElementById('waves-list-view');
  const detailView = document.getElementById('waves-detail-view');
  listView.classList.remove('hidden');
  detailView.classList.add('hidden');
  listView.innerHTML = '';

  const toolbar = document.createElement('div');
  toolbar.className = 'waves-toolbar';

  const trackSelect = document.createElement('select');
  trackSelect.className = 'track-select';
  for (const [id, track] of Object.entries(config.tracks || {})) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = track.name;
    if (id === selectedWaveTrack) opt.selected = true;
    trackSelect.appendChild(opt);
  }
  trackSelect.addEventListener('change', () => {
    selectedWaveTrack = trackSelect.value;
    selectedWaveRound = null;
    renderWavesList();
  });

  toolbar.innerHTML = `
    <p>Select a track, then click a round to edit enemy counts. Changes apply immediately — click <strong>Save</strong> to persist.</p>
  `;
  toolbar.prepend(trackSelect);
  listView.appendChild(toolbar);

  const trackWaves = getTrackWaves(selectedWaveTrack);
  const wrap = document.createElement('div');
  wrap.className = 'waves-table-wrap';
  const table = document.createElement('table');
  table.className = 'waves-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th style="width:64px">Round</th>
        <th>Summary</th>
        <th style="width:72px">Total</th>
      </tr>
    </thead>
  `;
  const tbody = document.createElement('tbody');

  for (const wave of trackWaves) {
    const tr = document.createElement('tr');
    tr.className = 'wave-row';
    tr.innerHTML = `
      <td>${wave.round}</td>
      <td class="wave-summary">${formatWaveSummary(wave, selectedWaveTrack)}</td>
      <td class="wave-total">${getWaveTotal(wave)}</td>
    `;
    tr.addEventListener('click', () => {
      selectedWaveRound = wave.round;
      renderWaveDetail(selectedWaveTrack, wave.round);
    });
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  wrap.appendChild(table);
  listView.appendChild(wrap);
}

function renderWaveDetail(trackId, round) {
  const wave = getWave(trackId, round);
  if (!wave) {
    selectedWaveRound = null;
    renderWavesList();
    return;
  }

  const listView = document.getElementById('waves-list-view');
  const detailView = document.getElementById('waves-detail-view');
  listView.classList.add('hidden');
  detailView.classList.remove('hidden');
  detailView.innerHTML = '';

  const trackName = config.tracks[trackId]?.name || trackId;
  const header = document.createElement('div');
  header.className = 'wave-detail-header';

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'btn-back';
  backBtn.textContent = '← All rounds';
  backBtn.addEventListener('click', () => {
    selectedWaveRound = null;
    renderWavesList();
  });

  const title = document.createElement('h3');
  title.textContent = `${trackName} — Round ${round}`;

  const stats = document.createElement('div');
  stats.className = 'wave-detail-stats';
  stats.innerHTML = `
    <span>Enemy types: <strong id="wave-type-count">0</strong></span>
    <span>Total units: <strong id="wave-unit-count">0</strong></span>
  `;

  header.appendChild(backBtn);
  header.appendChild(title);
  header.appendChild(stats);
  detailView.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'wave-enemy-grid';

  const profiles = Object.entries(config.enemyProfiles).sort((a, b) => {
    if (a[1].isBoss !== b[1].isBoss) return a[1].isBoss ? 1 : -1;
    return a[1].label.localeCompare(b[1].label);
  });

  const updateStats = () => {
    detailView.querySelector('#wave-type-count').textContent = wave.entries.length;
    detailView.querySelector('#wave-unit-count').textContent = getWaveTotal(wave);
  };

  for (const [profileType, profile] of profiles) {
    const count = getProfileCount(wave, profileType);
    const skin = config.trackEnemies?.[trackId]?.[profileType];
    const displayName = skin?.name || profile.label;
    const color = skin?.color || '#666';

    const card = document.createElement('div');
    card.className = `wave-enemy-card${count > 0 ? ' in-wave' : ''}`;

    const meta = getProfileMetaLabel(profile);
    const badgeClass = profile.isBoss ? ' wave-enemy-card__badge--boss' : '';

    card.innerHTML = `
      <div class="wave-enemy-card__swatch" style="background:${color}"></div>
      <div class="wave-enemy-card__info">
        <div class="wave-enemy-card__name">${displayName}</div>
        <div class="wave-enemy-card__meta">
          <span class="wave-enemy-card__badge${badgeClass}">${meta}</span>
          <span class="wave-enemy-card__profile">${profile.label}</span>
        </div>
      </div>
      <div class="wave-counter">
        <button type="button" class="counter-down" aria-label="Decrease">−</button>
        <span class="wave-counter__value">${count}</span>
        <button type="button" class="counter-up" aria-label="Increase">+</button>
      </div>
    `;

    const valueEl = card.querySelector('.wave-counter__value');
    const downBtn = card.querySelector('.counter-down');
    const upBtn = card.querySelector('.counter-up');

    const refresh = (newCount) => {
      setProfileCount(wave, profileType, newCount);
      valueEl.textContent = newCount;
      card.classList.toggle('in-wave', newCount > 0);
      downBtn.disabled = newCount <= 0;
      updateStats();
      refreshListSummaryRow(trackId, round);
    };

    downBtn.disabled = count <= 0;
    downBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      refresh(getProfileCount(wave, profileType) - 1);
    });
    upBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      refresh(getProfileCount(wave, profileType) + 1);
    });

    grid.appendChild(card);
  }

  detailView.appendChild(grid);
  updateStats();
}

function refreshListSummaryRow(trackId, round) {
  const wave = getWave(trackId, round);
  if (!wave) return;
  const rows = document.querySelectorAll('.wave-row');
  const trackWaves = getTrackWaves(trackId);
  const idx = trackWaves.findIndex((w) => w.round === round);
  if (idx === -1 || !rows[idx]) return;
  const row = rows[idx];
  row.querySelector('.wave-summary').innerHTML = formatWaveSummary(wave, trackId);
  row.querySelector('.wave-total').textContent = getWaveTotal(wave);
}

function renderAll() {
  renderConstants();
  renderProfiles();
  renderTrackEnemies();
  renderEntities('tab-towers', config.towers, [
    'attackSpeed', 'range', 'attackPower', 'buffPower',
    'effectMagnitude', 'effectDuration', 'buyCost', 'sellValue',
  ], 'towers');
  renderHeroes();
  selectedWaveRound = null;
  if (!config.tracks[selectedWaveTrack]) {
    selectedWaveTrack = Object.keys(config.tracks || {})[0] || 'amazon-office';
  }
  renderWaves();
}

function collectFormData() {
  document.querySelectorAll('[data-path]').forEach((el) => {
    const path = el.dataset.path.split('.');
    let obj = config;
    for (let i = 0; i < path.length - 1; i++) {
      const key = isNaN(path[i]) ? path[i] : parseInt(path[i], 10);
      obj = obj[key];
    }
    const lastKey = isNaN(path[path.length - 1])
      ? path[path.length - 1]
      : parseInt(path[path.length - 1], 10);
    if (el.type === 'text' && (obj[lastKey] === true || obj[lastKey] === false)) {
      obj[lastKey] = el.value === 'true';
    } else if (el.type === 'text') {
      obj[lastKey] = el.value;
    } else {
      obj[lastKey] = parseFloat(el.value);
    }
  });
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    if (tab.dataset.tab === 'waves' && selectedWaveRound !== null) {
      renderWaveDetail(selectedWaveTrack, selectedWaveRound);
    }
  });
});

document.getElementById('btn-save').addEventListener('click', () => {
  collectFormData();
  saveConfigToStorage(config);
  showStatus('Saved to localStorage!');
});

document.getElementById('btn-export').addEventListener('click', () => {
  collectFormData();
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'defaultConfig.json';
  a.click();
  URL.revokeObjectURL(url);
  showStatus('Config exported!');
});

document.getElementById('btn-import').addEventListener('click', () => {
  document.getElementById('file-import').click();
});

document.getElementById('file-import').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      config = JSON.parse(ev.target.result);
      renderAll();
      showStatus('Config imported — click Save to persist');
    } catch {
      showStatus('Invalid JSON file');
    }
  };
  reader.readAsText(file);
});

document.getElementById('btn-reset').addEventListener('click', () => {
  if (!confirm('Reset to bundled defaults? This clears localStorage override.')) return;
  clearConfigStorage();
  config = getBundledDefaultConfig();
  renderAll();
  showStatus('Reset to defaults');
});

renderAll();
