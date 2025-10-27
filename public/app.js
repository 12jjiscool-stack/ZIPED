// public/app.js

const ADDRESS = document.getElementById('address');
const GO = document.getElementById('goBtn');
const NEW = document.getElementById('newTabBtn');
const TABBAR = document.getElementById('tabBar');
const CONTENT = document.getElementById('contentArea');

let tabs = [];
let activeId = null;
let idCounter = 1;

function makeTab(url) {
  const id = 'tab-' + idCounter++;
  const tab = { id, url: url || 'ziped://home', title: 'Loading...' };
  tabs.push(tab);
  renderTabs();
  setActive(id);
  loadTab(tab);
}

function renderTabs() {
  TABBAR.innerHTML = '';
  for (const t of tabs) {
    const el = document.createElement('div');
    el.className = 'tab' + (t.id === activeId ? ' active' : '');
    el.dataset.id = t.id;

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = t.title || t.url;

    const close = document.createElement('button');
    close.className = 'close';
    close.textContent = '✕';
    close.onclick = (e) => {
      e.stopPropagation();
      closeTab(t.id);
    };

    el.appendChild(title);
    el.appendChild(close);
    el.onclick = () => {
      setActive(t.id);
      loadTab(t);
    };

    TABBAR.appendChild(el);
  }
}

function setActive(id) {
  activeId = id;
  renderTabs();
  // show loader
  CONTENT.innerHTML = '';
  const loader = document.createElement('div');
  loader.className = 'empty';
  loader.textContent = 'Loading...';
  CONTENT.appendChild(loader);
}

function closeTab(id) {
  const idx = tabs.findIndex(t=>t.id===id);
  if (idx>=0) tabs.splice(idx,1);
  if (activeId===id) {
    if (tabs.length) setActive(tabs[Math.max(0, idx-1)].id);
    else {
      activeId = null;
      CONTENT.innerHTML = '<div class="empty">Open a new tab to start.</div>';
    }
  } else renderTabs();
}

async function loadTab(tab) {
  // fetch proxied HTML from Netlify function
  try {
    const endpoint = '/.netlify/functions/proxy?url=' + encodeURIComponent(tab.url);
    const res = await fetch(endpoint);
    if (!res.ok) {
      const txt = await res.text();
      showError(txt || 'Error fetching page');
      return;
    }
    const html = await res.text();

    // create iframe with srcdoc
    CONTENT.innerHTML = '';
    const ifr = document.createElement('iframe');
    ifr.className = 'viewframe';
    ifr.sandbox = 'allow-scripts allow-forms';
    ifr.srcdoc = html;
    CONTENT.appendChild(ifr);

    // set title to url or to simple page title if available
    tab.title = shortLabel(tab.url);
    renderTabs();

    // update address bar for active tab
    if (tab.id === activeId) ADDRESS.value = tab.url;

  } catch (err) {
    showError('Network error: ' + err.message);
  }
}

function shortLabel(u) {
  return u.replace('ziped://','');
}

function showError(msg) {
  CONTENT.innerHTML = `<div class="empty">Error: ${escapeHtml(msg)}</div>`;
}

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// UI actions
GO.onclick = () => {
  const url = ADDRESS.value.trim();
  if (!url) return;
  if (activeId) {
    const tab = tabs.find(t=>t.id===activeId);
    tab.url = url;
    tab.title = shortLabel(url);
    loadTab(tab);
    renderTabs();
  } else {
    makeTab(url);
  }
};

NEW.onclick = () => makeTab('ziped://home');

ADDRESS.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') GO.click();
});

// Listen to messages from iframe pages for navigation
window.addEventListener('message', (ev) => {
  try {
    const msg = ev.data || {};
    if (msg.type === 'navigate' && msg.url) {
      // navigate current active tab to new URL
      if (!activeId) return;
      const tab = tabs.find(t=>t.id===activeId);
      tab.url = msg.url;
      tab.title = shortLabel(msg.url);
      loadTab(tab);
      renderTabs();
    } else if (msg.type === 'notfound') {
      // show small notice
      alert('Page not found: ' + msg.url);
    }
  } catch (e) { /* ignore */ }
});

// Start with one tab
makeTab('ziped://home');
