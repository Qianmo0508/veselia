const STORE = { ACC_KEY: 'veselia_acc_v1', CUR_KEY: 'veselia_cur_v1', SET_KEY: 'veselia_set_v1' };

function loadSettings() {
  let s = localStorage.getItem(STORE.SET_KEY);
  if(!s) {
    s = { theme: 'dark', fontSize: 1, bgmOn: true, bgmVol: 50, sfxOn: true, sfxVol: 50, textSpeed: 30, anims: true };
    localStorage.setItem(STORE.SET_KEY, JSON.stringify(s));
  } else { s = JSON.parse(s); }
  applySettings(s); if(window.AudioEngine) AudioEngine.updateSettings(s); return s;
}
function saveSettings(s) {
  localStorage.setItem(STORE.SET_KEY, JSON.stringify(s));
  applySettings(s); if(window.AudioEngine) AudioEngine.updateSettings(s);
}
function applySettings(s) {
  if(s.theme === 'dark') document.body.classList.add('dark');
  else document.body.classList.remove('dark');
  document.documentElement.style.setProperty('--font-scale', s.fontSize);
  if(s.anims) document.body.classList.remove('no-anims'); else document.body.classList.add('no-anims');
}

function loadAccounts(){ try{ return JSON.parse(localStorage.getItem(STORE.ACC_KEY)) || []; } catch(e){ return []; } }
function saveAccounts(list){ localStorage.setItem(STORE.ACC_KEY, JSON.stringify(list)); }
function currentAccountId(){ return localStorage.getItem(STORE.CUR_KEY) || null; }
function setCurrentAccount(id){ localStorage.setItem(STORE.CUR_KEY, id); }
function logout(){ localStorage.removeItem(STORE.CUR_KEY); }

function createAccount(nick, heroName, heroGender, avatar){
  const list = loadAccounts();
  const acc = {
    id: 'acc_' + Date.now().toString(36), nick: nick || '旅人', avatar: avatar || '◈', createdAt: Date.now(),
    hero: { name: heroName || '记者', gender: heroGender || '不限', origin: '王翼记者' },
    currency: { silver: 50 },
    progress: { currentLoc: 'solma', affection: {}, chatLogs: {}, visitedLocs: [] }
  };
  list.push(acc); saveAccounts(list); setCurrentAccount(acc.id); return acc;
}
function getAccount(id){ return loadAccounts().find(a => a.id === id) || null; }
function saveAccount(acc){
  const list = loadAccounts(); const i = list.findIndex(a => a.id === acc.id);
  if(i >= 0) list[i] = acc; else list.push(acc);
  saveAccounts(list);
}
function currentAccount(){ const id = currentAccountId(); return id ? getAccount(id) : null; }
function updateLocation(locId) { const acc = currentAccount(); if(acc) { acc.progress.currentLoc = locId; saveAccount(acc); } }
function addMemory(charId, text, affectionBonus = 1) {
  const acc = currentAccount(); if(!acc) return;
  if(!acc.progress.chatLogs[charId]) acc.progress.chatLogs[charId] = [];
  acc.progress.chatLogs[charId].push({ time: Date.now(), text: text });
  if(!acc.progress.affection[charId]) acc.progress.affection[charId] = 0;
  acc.progress.affection[charId] += affectionBonus;
  saveAccount(acc);
}
