/**
 * storage.js
 * -----------------------------------------------------------------------
 * Camada única de acesso ao localStorage. Nenhum outro arquivo deve
 * chamar localStorage diretamente — assim garantimos que o jogo continue
 * funcionando (sem travar) mesmo em navegadores com armazenamento
 * bloqueado ou em modo privado (fallback em memória).
 * -----------------------------------------------------------------------
 */

const Storage = (() => {
  const KEYS = {
    NAME: 'fm_player_name',
    RECORDS: 'fm_records',
    SETTINGS: 'fm_settings',
    TUTORIAL_SEEN: 'fm_tutorial_seen'
  };

  const DEFAULT_SETTINGS = {
    highContrast: false,
    fontSize: 'normal',      // 'normal' | 'grande' | 'muito-grande'
    reduceMotion: false,
    soundOn: true,
    volume: 0.7,
    vibrationOn: true
  };

  // Fallback em memória caso localStorage não esteja disponível.
  let memoryFallback = {};
  let storageAvailable = true;
  try {
    const testKey = '__fm_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
  } catch (e) {
    storageAvailable = false;
  }

  function readRaw(key) {
    if (!storageAvailable) return memoryFallback[key] ?? null;
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return memoryFallback[key] ?? null;
    }
  }

  function writeRaw(key, value) {
    if (!storageAvailable) {
      memoryFallback[key] = value;
      return;
    }
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      memoryFallback[key] = value;
    }
  }

  function getJSON(key, fallback) {
    const raw = readRaw(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function setJSON(key, value) {
    writeRaw(key, JSON.stringify(value));
  }

  // ---- Nome do jogador -----------------------------------------------
  function getPlayerName() {
    return readRaw(KEYS.NAME) || '';
  }
  function setPlayerName(name) {
    writeRaw(KEYS.NAME, (name || '').trim().slice(0, 16));
  }

  // ---- Recordes ---------------------------------------------------------
  function getRecords() {
    const list = getJSON(KEYS.RECORDS, []);
    return Array.isArray(list) ? list : [];
  }

  function addRecord(name, score) {
    const list = getRecords();
    list.push({ name: (name || 'JOGADOR').toUpperCase().slice(0, 16), score, date: Date.now() });
    list.sort((a, b) => b.score - a.score);
    const trimmed = list.slice(0, 20); // guarda até 20 recordes
    setJSON(KEYS.RECORDS, trimmed);
    return trimmed;
  }

  function getTopScore() {
    const list = getRecords();
    return list.length ? list[0].score : 0;
  }

  function isNewRecord(score) {
    return score > 0 && score >= getTopScore() && score > 0;
  }

  // ---- Configurações -----------------------------------------------------
  function getSettings() {
    return Object.assign({}, DEFAULT_SETTINGS, getJSON(KEYS.SETTINGS, {}));
  }
  function saveSettings(settings) {
    setJSON(KEYS.SETTINGS, settings);
  }

  // ---- Tutorial -----------------------------------------------------------
  function hasSeenTutorial() {
    return readRaw(KEYS.TUTORIAL_SEEN) === '1';
  }
  function markTutorialSeen() {
    writeRaw(KEYS.TUTORIAL_SEEN, '1');
  }

  return {
    storageAvailable,
    getPlayerName, setPlayerName,
    getRecords, addRecord, getTopScore, isNewRecord,
    getSettings, saveSettings,
    hasSeenTutorial, markTutorialSeen
  };
})();
