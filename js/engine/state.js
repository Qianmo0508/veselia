// 账号、存档、设置
const STORE = {
  ACC_KEY: 'veselia_accounts_v1',
  CUR_KEY: 'veselia_current_v1',
  SET_KEY: 'veselia_settings_v1'
};

// --- 设置管理 ---
function loadSettings() {
  let s = localStorage.getItem(STORE.SET_KEY);
  if(!s) {
    s = { theme: 'light', fontSize: 1, bgm: true, sfx: true };
    localStorage.setItem(STORE.SET_KEY, JSON.stringify(s));
  } else {
    s = JSON.parse(s);
  }
  applySettings(s);
  return s;
}
function saveSettings(s) {
  localStorage.setItem(STORE.SET_KEY, JSON.stringify(s));
  applySettings(s);
}
function applySettings(s) {
  // 切换主题
  if(s.theme === 'dark') document.body.classList.add('dark');
  else document.body.classList.remove('dark');
  // 调整字号
  document.documentElement.style.setProperty('--font-scale', s.fontSize);
}

// --- 账号管理 ---
function loadAccounts(){
  try{ return JSON.parse(localStorage.getItem(STORE.ACC_KEY)) || []; }
  catch(e){ return []; }
}
function saveAccounts(list){ localStorage.setItem(STORE.ACC_KEY, JSON.stringify(list)); }
function currentAccountId(){ return localStorage.getItem(STORE.CUR_KEY) || null; }
function setCurrentAccount(id){ localStorage.setItem(STORE.CUR_KEY, id); }

function createAccount(nick, heroName, heroGender, avatar){
  const list = loadAccounts();
  const acc = {
    id: 'acc_' + Date.now().toString(36),
    nick: nick || '旅人',
    avatar: avatar || '◈',
    createdAt: Date.now(),
    hero: { name: heroName || '记者', gender: heroGender || '不限', origin: '王翼记者' },
    currency: { silver: 50 },
    progress: { visited: [] }
  };
  list.push(acc); saveAccounts(list); setCurrentAccount(acc.id);
  return acc;
}
function getAccount(id){ return loadAccounts().find(a => a.id === id) || null; }
function saveAccount(acc){
  const list = loadAccounts();
  const i = list.findIndex(a => a.id === acc.id);
  if(i >= 0) list[i] = acc; else list.push(acc);
  saveAccounts(list);
}
function currentAccount(){
  const id = currentAccountId();
  return id ? getAccount(id) : null;
}
function logout(){ localStorage.removeItem(STORE.CUR_KEY); }
