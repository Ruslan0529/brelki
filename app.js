'use strict';

const COLORS = {
  burgundy: { name: 'Бордовый', cord: '#762943', bead: '#a65e76', light: '#d8a9b9' },
  peach: { name: 'Персиковый', cord: '#b96e53', bead: '#d99b88', light: '#efc1b2' },
  olive: { name: 'Оливковый', cord: '#7c8764', bead: '#a5ad8d', light: '#d0d4b7' },
  lilac: { name: 'Лавандовый', cord: '#a995bc', bead: '#b3a0c5', light: '#dfd3e8' },
  blue: { name: 'Голубой', cord: '#648ba0', bead: '#8eafbf', light: '#c9dde2' },
  cream: { name: 'Пудровый', cord: '#dabcb0', bead: '#d6bca6', light: '#efe0d0' },
  black: { name: 'Графитовый', cord: '#444342', bead: '#74736d', light: '#b4b2a8' },
};
const PET_NAMES = { cat: 'Котик', dog: 'Пёсик', other: 'Другой питомец' };
const DRAFT_KEY = 'hvostik-builder-v1';
const ORDER_KEY = 'hvostik-order-v1';
const defaults = { pet: 'cat', color: 'burgundy', heart: true, letter: false, petName: '', metal: 'silver' };
let state = { ...defaults };
let artId = 0;
let photoURLs = [];
let savedOrderText = '';
const form = document.querySelector('#builder-form');
const dialog = document.querySelector('#order-dialog');
const orderForm = document.querySelector('#order-form');

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function total(config = state) { return 18000 + (config.heart ? 2000 : 0) + (config.letter ? 1500 : 0); }
function money(value) { return new Intl.NumberFormat('ru-KZ').format(value) + ' ₸'; }

function petFace(type, id, pale = false) {
  if (type === 'dog') return `<g filter="url(#${id}-shadow)">
    <path d="M-43-23C-75-42-78-12-62 21Q-56 34-40 18Z" fill="#7d5840"/><path d="M43-23C75-42 78-12 62 21Q56 34 40 18Z" fill="#7d5840"/>
    <path d="M-48-23Q-45-50-8-43Q14-51 42-31Q61-8 45 29Q27 52-3 47Q-48 46-53 13Z" fill="url(#${id}-pet)"/>
    <path d="M-4-43Q10-29 3-13Q-14-3-7 18Q1 38-8 47Q26 48 38 26Q49-3 29-31Z" fill="#eee1c9"/>
    <ellipse cx="-20" cy="-3" rx="4" ry="5" fill="#403a32"/><ellipse cx="21" cy="-3" rx="4" ry="5" fill="#403a32"/>
    <circle cx="-21" cy="-5" r="1.1" fill="white"/><circle cx="20" cy="-5" r="1.1" fill="white"/>
    <ellipse cy="21" rx="25" ry="19" fill="#f4e8d5"/><path d="M-9 13Q0 9 9 13Q8 22 0 22Q-8 22-9 13" fill="#514438"/>
    <path d="M0 22v5m-9 0q9 8 18 0" fill="none" stroke="#7c6150" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M-34-20q5-5 12-4M24-24q6 0 9 4" fill="none" stroke="#875e40" stroke-width="2.5" stroke-linecap="round"/>
  </g>`;
  if (type === 'other') return `<g filter="url(#${id}-shadow)"><ellipse cx="-20" cy="-38" rx="11" ry="35" transform="rotate(-12 -20 -38)" fill="#e8dac0"/><ellipse cx="20" cy="-38" rx="11" ry="35" transform="rotate(12 20 -38)" fill="#e8dac0"/><ellipse cx="-20" cy="-40" rx="5" ry="24" transform="rotate(-12 -20 -40)" fill="#d5ada1"/><ellipse cx="20" cy="-40" rx="5" ry="24" transform="rotate(12 20 -40)" fill="#d5ada1"/><ellipse cy="10" rx="46" ry="39" fill="#e8dac0"/><ellipse cx="-17" cy="5" rx="3.5" ry="4" fill="#423d35"/><ellipse cx="17" cy="5" rx="3.5" ry="4" fill="#423d35"/><path d="M-5 17h10l-5 6Z" fill="#bc8b81"/><path d="M0 23v5m-7-1q7 6 14 0" fill="none" stroke="#9e8b78" stroke-width="1.3"/><ellipse cx="-28" cy="19" rx="7" ry="3" fill="#d5ada1" opacity=".6"/><ellipse cx="28" cy="19" rx="7" ry="3" fill="#d5ada1" opacity=".6"/></g>`;
  return `<g filter="url(#${id}-shadow)">
    <path d="M-44-15L-44-57Q-40-66-32-58L-13-40Q0-46 15-40L34-59Q43-67 46-56L46-12Q65 30 34 47Q0 63-36 45Q-64 25-44-15Z" fill="url(#${id}-pet)"/>
    <path d="M-38-27l1-23 17 17Z" fill="#cb947f"/><path d="M24-32l15-20 1 25Z" fill="#cb947f"/>
    <path d="M-14-39l7 20M1-42v20M16-38l-6 18" fill="none" stroke="${pale ? '#b5a58f' : '#b87640'}" stroke-width="5" stroke-linecap="round" opacity=".65"/>
    <path d="M-44-9l14 5M-48 3l15 3M45-10l-13 5M48 3l-15 3" fill="none" stroke="${pale ? '#b5a58f' : '#b87640'}" stroke-width="4" stroke-linecap="round" opacity=".65"/>
    <path d="M-27 20Q-20 9 0 17Q22 9 28 22Q32 47 1 48Q-31 47-27 20Z" fill="#f7e8cd"/>
    <ellipse cx="-19" cy="4" rx="5" ry="6" fill="#555443"/><ellipse cx="20" cy="4" rx="5" ry="6" fill="#555443"/>
    <ellipse cx="-19" cy="4" rx="2" ry="5" fill="#292c24"/><ellipse cx="20" cy="4" rx="2" ry="5" fill="#292c24"/>
    <circle cx="-21" cy="2" r="1.4" fill="#fff"/><circle cx="18" cy="2" r="1.4" fill="#fff"/>
    <path d="M-6 18Q0 15 6 18L0 24Z" fill="#bf8d7d"/><path d="M0 24v6m-8-1q8 7 16 0" fill="none" stroke="#8c7864" stroke-width="1.5" stroke-linecap="round"/>
    <g stroke="#ae957a" stroke-width=".9" opacity=".7"><path d="M-21 22l-22-4M-21 28l-25 3M21 22l23-4M21 28l24 3"/></g>
    <ellipse cx="-32" cy="18" rx="7" ry="3" fill="#cb947f" opacity=".35"/><ellipse cx="33" cy="18" rx="7" ry="3" fill="#cb947f" opacity=".35"/>
  </g>`;
}

function illustration(config, options = {}) {
  const id = 'art-' + ++artId;
  const color = COLORS[config.color] || COLORS.peach;
  const gold = config.metal === 'gold';
  const fur = config.pet === 'dog' ? ['#dfbe85', '#bd8a4e'] : options.pale ? ['#eee4ce', '#cfc1a9'] : ['#e7b87b', '#c48b4d'];
  const initial = Array.from(config.petName.trim())[0]?.toLocaleUpperCase('ru-RU') || 'А';
  return `<svg class="keychain-svg" viewBox="0 0 440 540" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="${id}-metal" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${gold ? '#917438' : '#828980'}"/><stop offset=".26" stop-color="${gold ? '#efd69a' : '#ecede2'}"/><stop offset=".48" stop-color="${gold ? '#ad8a42' : '#9ca399'}"/><stop offset=".7" stop-color="${gold ? '#f4dda6' : '#f6f6ec'}"/><stop offset="1" stop-color="${gold ? '#a17f3c' : '#777f74'}"/></linearGradient>
      <radialGradient id="${id}-bead" cx=".3" cy=".25" r=".75"><stop stop-color="${color.light}"/><stop offset=".6" stop-color="${color.bead}"/><stop offset="1" stop-color="${color.cord}"/></radialGradient>
      <radialGradient id="${id}-pet" cx=".35" cy=".2" r=".9"><stop stop-color="${fur[0]}"/><stop offset=".7" stop-color="${fur[0]}"/><stop offset="1" stop-color="${fur[1]}"/></radialGradient>
      <linearGradient id="${id}-ivory" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff8e8"/><stop offset=".6" stop-color="#ede2cb"/><stop offset="1" stop-color="#c6b59b"/></linearGradient>
      <filter id="${id}-shadow" x="-60%" y="-60%" width="230%" height="240%"><feDropShadow dx="3" dy="6" stdDeviation="4" flood-color="#6e5740" flood-opacity=".19"/></filter>
      <filter id="${id}-floor"><feGaussianBlur stdDeviation="9"/></filter>
    </defs>
    <ellipse cx="233" cy="474" rx="95" ry="12" fill="#7e6b54" opacity=".13" filter="url(#${id}-floor)"/>
    <g transform="rotate(-12 220 270)">
      <g filter="url(#${id}-shadow)"><path d="M202 112C132 176 116 326 167 406Q206 459 250 428C305 397 301 190 232 116" fill="none" stroke="${color.cord}" stroke-width="9" stroke-linecap="round"/><path d="M202 112C132 176 116 326 167 406Q206 459 250 428C305 397 301 190 232 116" fill="none" stroke="${color.light}" stroke-width="2" stroke-linecap="round" opacity=".47"/><path d="M214 124Q215 152 224 171L217 443M230 125Q240 179 241 208L228 440" fill="none" stroke="${color.cord}" stroke-width="6" stroke-linecap="round"/><path d="M213 125Q215 153 224 171L217 443" fill="none" stroke="${color.light}" stroke-width="1.3" opacity=".4"/></g>
      <g filter="url(#${id}-shadow)"><path d="M193 70Q193 48 216 45Q243 43 246 67L243 94Q242 115 222 121Q194 123 193 98Z" fill="none" stroke="url(#${id}-metal)" stroke-width="8"/><path d="M242 71l-1 23" stroke="#5e6757" stroke-width="2"/><path d="M205 50Q214 44 225 49" fill="none" stroke="#fff9" stroke-width="2" stroke-linecap="round"/><circle cx="222" cy="125" r="12" fill="none" stroke="url(#${id}-metal)" stroke-width="4"/></g>
      <g stroke="${color.cord}" stroke-width="5" stroke-linecap="round"><path d="M214 139l15 4M215 145l15 4M217 151l14 3M219 157l11 2"/></g>
      <g filter="url(#${id}-shadow)"><circle cx="228" cy="196" r="23" fill="url(#${id}-bead)"/><ellipse cx="220" cy="184" rx="7" ry="4" fill="#fff" opacity=".35" transform="rotate(-25 220 184)"/><circle cx="227" cy="174" r="3" fill="${color.cord}"/></g>
      ${config.letter ? `<g transform="translate(227 253) rotate(8)" filter="url(#${id}-shadow)"><rect x="-19" y="-20" width="38" height="40" rx="8" fill="url(#${id}-ivory)"/><text x="0" y="9" font-size="26" fill="${color.cord}" font-family="Georgia,serif" text-anchor="middle">${escapeHTML(initial)}</text></g>` : `<g filter="url(#${id}-shadow)"><ellipse cx="227" cy="252" rx="18" ry="19" fill="url(#${id}-ivory)"/><path d="M218 238q6-5 12-2" fill="none" stroke="#fff" opacity=".6" stroke-width="2"/></g>`}
      ${config.heart ? `<g transform="translate(285 292) rotate(20)" filter="url(#${id}-shadow)"><circle cy="-28" r="6" fill="none" stroke="url(#${id}-metal)" stroke-width="2"/><path d="M0 23C-50-8-22-40 0-17C22-40 50-8 0 23Z" fill="${color.bead}"/><path d="M-20-14q4-10 12-5" fill="none" stroke="${color.light}" stroke-width="3" stroke-linecap="round" opacity=".7"/></g><path d="M238 126Q299 201 285 261" stroke="${color.cord}" stroke-width="3" fill="none"/>` : ''}
      <circle cx="225" cy="283" r="8" fill="none" stroke="url(#${id}-metal)" stroke-width="2.5"/>
      <g transform="translate(226 354) rotate(7)">${petFace(config.pet, id, options.pale)}</g>
      <g stroke="${color.cord}" stroke-width="5" stroke-linecap="round"><path d="M214 425l17 2M214 431l17 2M215 437l14 2"/></g>
      <path d="M216 442l-4 21M227 444l4 15" stroke="${color.cord}" stroke-width="5" stroke-linecap="round"/>
    </g>
  </svg>`;
}

function render() {
  paintIllustration(document.querySelector('#builder-preview'), illustration(state, { pale: state.color === 'lilac' }));
  document.querySelector('#builder-preview').setAttribute('aria-label', `${PET_NAMES[state.pet]}, ${COLORS[state.color].name.toLowerCase()} шнур, ${state.metal === 'gold' ? 'золотистый' : 'серебристый'} карабин${state.heart ? ', сердечко' : ''}${state.letter ? ', именная бусина' : ''}`);
  document.querySelector('#color-label').textContent = COLORS[state.color].name;
  document.querySelector('#total-price').textContent = money(total());
  document.querySelector('#name-field').hidden = !state.letter;
  document.querySelector('#other-pet-note').hidden = state.pet !== 'other';
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state)); } catch { /* The builder also works without storage. */ }
}

function syncForm() {
  for (const key of ['pet', 'color', 'metal']) {
    for (const input of form.elements[key]) input.checked = input.value === state[key];
  }
  form.elements.heart.checked = state.heart;
  form.elements.letter.checked = state.letter;
  form.elements.petName.value = state.petName;
}

try {
  const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
  if (draft && typeof draft === 'object') {
    state = {
      pet: Object.hasOwn(PET_NAMES, draft.pet) ? draft.pet : defaults.pet,
      color: Object.hasOwn(COLORS, draft.color) ? draft.color : defaults.color,
      heart: typeof draft.heart === 'boolean' ? draft.heart : defaults.heart,
      letter: typeof draft.letter === 'boolean' ? draft.letter : defaults.letter,
      petName: typeof draft.petName === 'string' ? draft.petName.slice(0, 16) : '',
      metal: ['silver', 'gold'].includes(draft.metal) ? draft.metal : defaults.metal,
    };
  }
} catch { /* Ignore absent or damaged local drafts. */ }

document.querySelectorAll('.swatches input').forEach(input => input.setAttribute('aria-label', COLORS[input.value].name));
paintIllustration(document.querySelector('[data-art="hero"]'), illustration(defaults));
paintIllustration(document.querySelector('.hero-art'), document.querySelector('#brand-seal-art').innerHTML, 'brand-seal');
const presets = {
  peach: { ...defaults, color: 'peach' },
  olive: { ...defaults, pet: 'dog', color: 'olive', letter: true, heart: false, petName: 'Бим', metal: 'gold' },
  lilac: { ...defaults, color: 'lilac', metal: 'silver' },
};
for (const [key, config] of Object.entries(presets)) {
  paintIllustration(document.querySelector(`[data-art="${key}"]`), illustration(config, { pale: key === 'lilac' }));
}

form.addEventListener('input', () => {
  const values = new FormData(form);
  state = { pet: values.get('pet'), color: values.get('color'), metal: values.get('metal'), heart: values.has('heart'), letter: values.has('letter'), petName: String(values.get('petName') || '') };
  render();
});
document.querySelector('#reset-builder').addEventListener('click', () => { state = { ...defaults }; syncForm(); render(); });
document.querySelectorAll('[data-preset]').forEach(button => {
  button.addEventListener('click', () => {
    state = { ...presets[button.dataset.preset] };
    syncForm(); render();
    document.querySelector('#builder').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });
});

function clearPhotos() {
  photoURLs.forEach(url => URL.revokeObjectURL(url));
  photoURLs = [];
  document.querySelector('#photo-previews').replaceChildren();
}

form.addEventListener('submit', event => {
  event.preventDefault();
  orderForm.hidden = false;
  document.querySelector('#order-success').hidden = true;
  document.querySelector('#storage-error').hidden = true;
  document.querySelector('#copy-feedback').textContent = '';
  const extras = [state.heart && 'сердечко', state.letter && 'именная бусина'].filter(Boolean).join(', ') || 'без дополнительных деталей';
  document.querySelector('#order-summary').innerHTML = `<strong>${escapeHTML(PET_NAMES[state.pet])}${state.petName.trim() ? ' · ' + escapeHTML(state.petName.trim()) : ''} — ${money(total())}</strong>${COLORS[state.color].name} шнур · ${state.metal === 'gold' ? 'золотистый' : 'серебристый'} карабин<br>${extras}<br><small>Доставка отдельно. Цены в прототипе примерные.</small>`;
  dialog.showModal();
  document.body.classList.add('modal-open');
});

document.querySelectorAll('.close-button').forEach(button => button.addEventListener('click', () => dialog.close()));
dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
});

document.querySelector('#pet-photos').addEventListener('change', event => {
  clearPhotos();
  const files = Array.from(event.target.files);
  const error = document.querySelector('#photo-error');
  error.hidden = true;
  const invalid = files.length > 5 || files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024);
  if (invalid) {
    error.textContent = 'Выберите до 5 фото JPEG, PNG или WebP размером до 10 МБ каждое.';
    error.hidden = false;
    event.target.value = '';
    return;
  }
  files.forEach(file => {
    const url = URL.createObjectURL(file);
    photoURLs.push(url);
    const image = document.createElement('img');
    image.src = url;
    image.alt = `Фото питомца: ${file.name}`;
    document.querySelector('#photo-previews').append(image);
  });
});

orderForm.addEventListener('submit', event => {
  event.preventDefault();
  const values = new FormData(orderForm);
  const customerName = String(values.get('customerName') || '').trim();
  const contact = String(values.get('contact') || '').trim();
  if (!customerName || !contact) {
    const field = orderForm.elements[!customerName ? 'customerName' : 'contact'];
    field.setCustomValidity('Заполните поле, пожалуйста.');
    field.reportValidity();
    return;
  }
  const photoNames = Array.from(document.querySelector('#pet-photos').files, file => file.name);
  const order = { config: { ...state }, price: total(), currency: 'KZT', customerName, contact, comment: String(values.get('comment') || '').trim(), photoNames, createdAt: new Date().toISOString() };
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch {
    document.querySelector('#storage-error').textContent = 'Браузер не разрешил сохранить заявку. Разрешите локальное хранилище и попробуйте ещё раз.';
    document.querySelector('#storage-error').hidden = false;
    return;
  }
  savedOrderText = [
    'Заявка на брелок obscurium.lab',
    `Имя: ${customerName}`, `Контакт: ${contact}`, `Питомец: ${PET_NAMES[state.pet]}${state.petName.trim() ? ', ' + state.petName.trim() : ''}`,
    `Шнур: ${COLORS[state.color].name}`, `Карабин: ${state.metal === 'gold' ? 'золотистый' : 'серебристый'}`,
    `Детали: ${[state.heart && 'сердечко', state.letter && 'именная бусина'].filter(Boolean).join(', ') || 'без дополнительных деталей'}`,
    `Примерная стоимость: ${money(total())}, доставка отдельно`,
    order.comment && `Пожелания: ${order.comment}`,
    photoNames.length ? `Фото для отдельного прикрепления: ${photoNames.join(', ')}` : 'Фото питомца добавлю позже',
  ].filter(Boolean).join('\n');
  orderForm.hidden = true;
  document.querySelector('#order-success').hidden = false;
  document.querySelector('#copy-order').focus();
  dialog.scrollTop = 0;
});
orderForm.addEventListener('input', event => {
  if (typeof event.target.setCustomValidity === 'function') event.target.setCustomValidity('');
});
document.querySelector('#copy-order').addEventListener('click', async () => {
  const feedback = document.querySelector('#copy-feedback');
  try {
    await navigator.clipboard.writeText(savedOrderText);
    feedback.textContent = 'Скопировано. Можно вставить в сообщение мастеру.';
  } catch {
    const text = document.createElement('textarea');
    text.value = savedOrderText;
    text.setAttribute('aria-label', 'Текст заявки для ручного копирования');
    feedback.replaceChildren(text);
    text.focus(); text.select();
  }
});
document.querySelector('#new-order').addEventListener('click', () => {
  dialog.close(); orderForm.reset(); clearPhotos();
  document.querySelector('#photo-error').hidden = true;
});
syncForm();
render();
