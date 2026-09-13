/**
 * DQM4 ステータス計算スクリプト (Vanilla JavaScript)
 */

const STORAGE_KEY = 'dqm4_pedigree_bonus_calc_data';

const systemNames = {
  none: '指定なし',
  slime: 'スライム',
  dragon: 'ドラゴン',
  nature: '自然',
  beast: '魔獣',
  demon: '悪魔',
  zombie: 'ゾンビ',
  material: '物質',
  legend: '???',
};

const systemBonusMap = {
  slime: { hp: true, mp: false, atk: false, def: false, spd: true, wis: true },
  dragon: { hp: true, mp: true, atk: true, def: false, spd: false, wis: false },
  nature: { hp: false, mp: false, atk: false, def: true, spd: true, wis: true },
  beast: { hp: false, mp: true, atk: false, def: true, spd: true, wis: false },
  demon: { hp: false, mp: true, atk: true, def: true, spd: false, wis: false },
  zombie: { hp: true, mp: true, atk: false, def: false, spd: true, wis: false },
  material: { hp: false, mp: false, atk: true, def: true, spd: false, wis: true },
  legend: { hp: true, mp: false, atk: true, def: false, spd: false, wis: true },
};

const personalityMap = {
  いのちしらず: { hp: 0, mp: 0, atk: 100, def: -100, spd: 100, wis: -100 },
  がんばりや: { hp: 200, mp: -100, atk: 0, def: 0, spd: 0, wis: -100 },
  きまぐれ: { hp: 100, mp: 0, atk: 0, def: 100, spd: -100, wis: -100 },
  じょうねつか: { hp: 0, mp: 200, atk: -100, def: -100, spd: 0, wis: 0 },
  せっきょくてき: { hp: -100, mp: 100, atk: -100, def: 0, spd: 100, wis: 0 },
  たかびしゃ: { hp: -100, mp: 100, atk: 0, def: -100, spd: 0, wis: 100 },
  ちょとつもうしん: { hp: 0, mp: -100, atk: 0, def: -100, spd: 200, wis: 0 },
  にんじょうか: { hp: 0, mp: -100, atk: -100, def: 100, spd: 0, wis: 100 },
  まけずぎらい: { hp: 0, mp: 0, atk: -100, def: 200, spd: 0, wis: -100 },
  まじめ: { hp: 0, mp: 0, atk: 0, def: 0, spd: 0, wis: 0 },
  ゆうかん: { hp: -100, mp: 0, atk: 200, def: 0, spd: 0, wis: -100 },
  らくてんか: { hp: 100, mp: -100, atk: 100, def: 0, spd: -100, wis: 0 },
  れいせい: { hp: -100, mp: 0, atk: 0, def: 0, spd: -100, wis: 200 },
};

const actionTraitMultipliers = {
  '1': { hp: 1, mp: 1, atk: 1, def: 1, spd: 1, wis: 1 },
  '1-2': { hp: 0.9, mp: 0.9, atk: 0.9, def: 0.9, spd: 0.9, wis: 0.9 },
  '1-3': { hp: 0.8, mp: 0.8, atk: 0.8, def: 0.8, spd: 0.8, wis: 0.8 },
  '2': { hp: 0.8, mp: 0.8, atk: 0.8, def: 0.8, spd: 0.8, wis: 0.8 },
  '2-3': { hp: 0.7, mp: 0.7, atk: 0.7, def: 0.7, spd: 0.7, wis: 0.7 },
  '1-metal': { hp: 0.333333333, mp: 1, atk: 1, def: 1, spd: 1, wis: 1 },
  '1-2-metal': { hp: 0.283333333, mp: 0.85, atk: 0.85, def: 1, spd: 1, wis: 0.85 },
  '1-3-metal': { hp: 0.233333333, mp: 0.7, atk: 0.7, def: 1, spd: 1, wis: 0.7 },
};

const sizeMultipliers = {
  S: { hp: 1.0, mp: 1.0, atk: 1.0, def: 1.0, spd: 1.0, wis: 1.0 },
  L: { hp: 1.5, mp: 1.5, atk: 1.1, def: 1.1, spd: 1.1, wis: 1.1 },
};

const statsConfig = [
  { id: 'hp', name: 'HP' },
  { id: 'mp', name: 'MP' },
  { id: 'atk', name: '攻撃' },
  { id: 'def', name: '守備' },
  { id: 'spd', name: '素早' },
  { id: 'wis', name: '賢さ' },
];

const inputIds = [
  'plus',
  'personality',
  'ai',
  'stat-hp',
  'stat-mp',
  'stat-atk',
  'stat-def',
  'stat-spd',
  'stat-wis',
  'parent1',
  'parent2',
  'grandparent1',
  'grandparent2',
  'grandparent3',
  'grandparent4',
];

function renderMatrixTable() {
  const tbody = document.getElementById('matrix-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  Object.keys(systemBonusMap).forEach((sysKey) => {
    const sysName = systemNames[sysKey] || sysKey;
    const rowMap = systemBonusMap[sysKey];
    const tr = document.createElement('tr');
    let html = '<td class="stat-name">' + sysName + '</td>';
    statsConfig.forEach((stat) => {
      html += rowMap[stat.id]
        ? '<td class="circle-mark">○</td>'
        : '<td class="dash-mark">-</td>';
    });
    tr.innerHTML = html;
    tbody.appendChild(tr);
  });
}

function renderPersonalityTable() {
  const tbody = document.getElementById('personality-matrix-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  const currentSelected = document.getElementById('personality')?.value;

  Object.entries(personalityMap).forEach(([name, corrections]) => {
    const tr = document.createElement('tr');
    if (name === currentSelected) {
      tr.classList.add('selected-row');
    }
    tr.style.cursor = 'pointer';
    tr.title = `${name} を選択`;
    tr.addEventListener('click', () => {
      const select = document.getElementById('personality');
      if (select) {
        select.value = name;
        calculate();
        renderPersonalityTable();
      }
    });

    let html = '<td class="stat-name">' + name + '</td>';
    statsConfig.forEach((stat) => {
      const val = corrections[stat.id] !== undefined ? corrections[stat.id] : 0;
      if (val === 200) {
        // +200 は +100 と一目で見てわかるように特化スタイルを適用 (王冠なし)
        html +=
          '<td><span class="personality-plus-200" title="+200 特化ボーナス">+200</span></td>';
      } else if (val === 100) {
        html += '<td><span class="personality-plus-100">+100</span></td>';
      } else if (val < 0) {
        html += '<td><span class="personality-minus">' + val + '</span></td>';
      } else {
        html += '<td><span class="personality-zero">0</span></td>';
      }
    });
    tr.innerHTML = html;
    tbody.appendChild(tr);
  });
}

export function calculate() {
  const plus = parseFloat(document.getElementById('plus').value) || 0;
  const gpCoeff = 0.5;
  const personality = document.getElementById('personality').value;

  const sizeRadio = document.querySelector('input[name="size"]:checked');
  const size = sizeRadio ? sizeRadio.value : 'S';
  const ai = document.getElementById('ai').value || '1';

  const parents = [
    document.getElementById('parent1').value,
    document.getElementById('parent2').value,
  ];
  const grandparents = [
    document.getElementById('grandparent1').value,
    document.getElementById('grandparent2').value,
    document.getElementById('grandparent3').value,
    document.getElementById('grandparent4').value,
  ];

  // 祖父母ボーナス判定: 4体すべて none 以外かつ全て異なる系統
  const activeGPs = grandparents.filter((gp) => gp !== 'none');
  const uniqueGPs = new Set(activeGPs);
  const hasGPBonus = activeGPs.length === 4 && uniqueGPs.size === 4;

  const gpBonusEl = document.getElementById('gp-bonus-display');
  if (gpBonusEl) {
    if (hasGPBonus) {
      gpBonusEl.className = 'gp-bonus-badge gp-bonus-active';
      gpBonusEl.textContent = '✨ 祖父母ボーナス発生中！（全ステータス係数 +1.0）';
    } else {
      gpBonusEl.className = 'gp-bonus-badge gp-bonus-inactive';
      gpBonusEl.textContent = '祖父母ボーナス：なし（4体すべて異なる系統で発生）';
    }
  }

  const personalityCorr = personalityMap[personality] || null;
  const aiRates = actionTraitMultipliers[ai] || actionTraitMultipliers['1'];
  const sizeRates = sizeMultipliers[size] || sizeMultipliers['S'];

  statsConfig.forEach((stat) => {
    const cap = parseFloat(document.getElementById('stat-' + stat.id).value) || 0;

    let totalCoeff = 0;
    parents.forEach((p) => {
      if (systemBonusMap[p] && systemBonusMap[p][stat.id]) totalCoeff += 1.0;
    });
    grandparents.forEach((gp) => {
      if (systemBonusMap[gp] && systemBonusMap[gp][stat.id]) totalCoeff += gpCoeff;
    });
    if (hasGPBonus) totalCoeff += 1.0;

    // 倍率 = 特性倍率 * サイズ補正 の積
    const aiRate = aiRates[stat.id] ?? 1.0;
    const sizeRate = sizeRates[stat.id] ?? 1.0;
    const rate = aiRate * sizeRate;

    // 基準値 * 倍率 (切り上げ Math.ceil)
    const baseScaled = Math.ceil(cap * rate);

    // 系図: floor(基準値 × 合計係数 × 子プラス値 / 2500)
    const boost = Math.floor((cap * totalCoeff * plus) / 2500);

    // 性格補正
    const corrVal = personalityCorr ? personalityCorr[stat.id] || 0 : 0;

    // 最終ステータス = Math.ceil(基準値 * 倍率) + 系図 + 性格補正
    const finalStat = baseScaled + boost + corrVal;

    // 各要素の更新
    const coeffElem = document.getElementById('coeff-' + stat.id);
    const boostElem = document.getElementById('boost-' + stat.id);
    const corrElem = document.getElementById('corr-' + stat.id);
    const finalElem = document.getElementById('final-' + stat.id);

    if (coeffElem) coeffElem.textContent = totalCoeff.toFixed(1);
    if (boostElem) boostElem.textContent = '+' + boost.toLocaleString();
    if (corrElem) {
      if (corrVal > 0) {
        corrElem.className = corrVal === 200 ? 'col-corr corr-200' : 'col-corr corr-plus';
        corrElem.textContent = '+' + corrVal;
      } else if (corrVal < 0) {
        corrElem.className = 'col-corr corr-minus';
        corrElem.textContent = '' + corrVal;
      } else {
        corrElem.className = 'col-corr corr-zero';
        corrElem.textContent = '0';
      }
    }
    if (finalElem) finalElem.textContent = finalStat.toLocaleString();
  });

  saveToLocalStorage();
}

function saveToLocalStorage() {
  const data = {};
  inputIds.forEach((id) => {
    const elem = document.getElementById(id);
    if (elem) data[id] = elem.value;
  });
  const sizeRadio = document.querySelector('input[name="size"]:checked');
  if (sizeRadio) data['size'] = sizeRadio.value;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // ignore
  }
}

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      inputIds.forEach((id) => {
        if (data[id] !== undefined) {
          const elem = document.getElementById(id);
          if (elem) elem.value = data[id];
        }
      });
      if (data['size']) {
        const targetRadio = document.querySelector(
          `input[name="size"][value="${data['size']}"]`
        );
        if (targetRadio) targetRadio.checked = true;
      }
    }
  } catch (e) {
    // ignore
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
  renderMatrixTable();
  renderPersonalityTable();
  calculate();

  document.querySelectorAll('input, select').forEach((elem) => {
    elem.addEventListener('input', () => {
      calculate();
      if (elem.id === 'personality') {
        renderPersonalityTable();
      }
    });
    elem.addEventListener('change', () => {
      calculate();
      if (elem.id === 'personality') {
        renderPersonalityTable();
      }
    });
  });

  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      document.getElementById('plus').value = 3;
      document.getElementById('personality').value = 'まじめ';
      const sRadio = document.querySelector('input[name="size"][value="S"]');
      if (sRadio) sRadio.checked = true;
      document.getElementById('ai').value = '1';

      document.getElementById('stat-hp').value = 1390;
      document.getElementById('stat-mp').value = 540;
      document.getElementById('stat-atk').value = 490;
      document.getElementById('stat-def').value = 540;
      document.getElementById('stat-spd').value = 430;
      document.getElementById('stat-wis').value = 520;

      document.getElementById('parent1').value = 'slime';
      document.getElementById('parent2').value = 'material';
      document.getElementById('grandparent1').value = 'none';
      document.getElementById('grandparent2').value = 'none';
      document.getElementById('grandparent3').value = 'none';
      document.getElementById('grandparent4').value = 'none';

      calculate();
      renderPersonalityTable();
    });
  }
});
