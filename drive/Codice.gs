/* =====================================================================
   BoardLab → Google Drive · versione 1
   ---------------------------------------------------------------------
   Questo script riceve le lavagne da BoardLab e le salva nel tuo Drive.
   - Crea la cartella "BoardLab" nel tuo Drive e, dentro, una cartella
     per ogni cartella di BoardLab che colleghi (oppure usa una cartella
     che scegli tu incollandone il link in BoardLab).
   - Una lavagna già inviata viene aggiornata: stesso file, stesso link.
   - Non cancella mai niente.

   Il primo BoardLab che si collega diventa l'unico autorizzato.
   Per collegare un altro dispositivo (per esempio il nuovo APK):
   scegli la funzione "scollegaBoardLab" in alto, premi Esegui,
   poi collega il nuovo dispositivo.

   Serve il servizio "Drive API" (a sinistra: Servizi → + → Drive API → Aggiungi).
   ===================================================================== */

const CARTELLA_PRINCIPALE = 'BoardLab';

function doGet() {
  return risposta({ ok: true, app: 'BoardLab Drive', v: 1 });
}

function doPost(e) {
  let r;
  try { r = JSON.parse(e.postData.contents); } catch (err) { return risposta({ ok: false, err: 'richiesta' }); }
  try {
    if (!chiaveValida(r)) return risposta({ ok: false, err: 'chiave' });
    if (r.a === 'ping') return risposta({ ok: true, v: 1, email: Session.getEffectiveUser().getEmail() });
    if (r.a === 'folder') return risposta(cartella(r));
    if (r.a === 'put') return risposta(salva(r));
    return risposta({ ok: false, err: 'azione' });
  } catch (err) {
    return risposta({ ok: false, err: 'drive', msg: String((err && err.message) || err) });
  }
}

/* Abbinamento: la prima chiave ricevuta viene memorizzata, le altre vengono rifiutate */
function chiaveValida(r) {
  const k = typeof r.key === 'string' ? r.key : '';
  if (k.length < 24) return false;
  const props = PropertiesService.getScriptProperties();
  const salvata = props.getProperty('CHIAVE');
  if (salvata) return salvata === k;
  if (r.a !== 'ping') return false;
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ancora = props.getProperty('CHIAVE');
    if (ancora) return ancora === k;
    props.setProperty('CHIAVE', k);
    return true;
  } finally { lock.releaseLock(); }
}

/* Cartella di destinazione: da un link, da un id già collegato o creata in BoardLab/<nome> */
function cartella(r) {
  if (r.link) {
    const m = String(r.link).match(/folders\/([\w-]{10,})/) || String(r.link).match(/[?&]id=([\w-]{10,})/) || String(r.link).match(/^([\w-]{10,})$/);
    if (!m) return { ok: false, err: 'link' };
    return infoCartella(m[1]);
  }
  if (r.id) return infoCartella(r.id);
  const nome = String(r.name || 'Lavagne').slice(0, 120);
  const radice = trovaOCrea(DriveApp.getRootFolder(), CARTELLA_PRINCIPALE);
  const f = trovaOCrea(radice, nome);
  return { ok: true, id: f.getId(), name: CARTELLA_PRINCIPALE + ' / ' + f.getName(), url: f.getUrl() };
}
function infoCartella(id) {
  let f;
  try { f = DriveApp.getFolderById(id); f.getName(); } catch (err) { return { ok: false, err: 'cartella' }; }
  if (f.isTrashed()) return { ok: false, err: 'cartella' };
  return { ok: true, id: f.getId(), name: f.getName(), url: f.getUrl() };
}
function trovaOCrea(dentro, nome) {
  const it = dentro.getFoldersByName(nome);
  while (it.hasNext()) { const f = it.next(); if (!f.isTrashed()) return f; }
  return dentro.createFolder(nome);
}

/* Salvataggio di un file: aggiorna quello della stessa lavagna e formato, altrimenti lo crea */
function salva(r) {
  if (!/^[\w-]{1,64}$/.test(r.board || '') || !/^[a-z]{2,10}$/.test(r.fmt || '') || !/^[\w-]{10,}$/.test(r.folder || '')) return { ok: false, err: 'richiesta' };
  const nome = String(r.name || 'lavagna').slice(0, 200), tipo = String(r.mime || 'application/octet-stream');
  const blob = Utilities.newBlob(Utilities.base64Decode(r.data || ''), tipo, nome);
  let id = r.file && /^[\w-]{10,}$/.test(r.file) ? r.file : null;
  if (id && !nellaCartella(id, r.folder)) id = null;
  if (!id) id = cerca(r.folder, r.board, r.fmt);
  let f;
  if (id) {
    f = Drive.Files.update({ name: nome }, id, blob, { fields: 'id', supportsAllDrives: true });
  } else {
    f = Drive.Files.create({ name: nome, parents: [r.folder], mimeType: tipo, appProperties: { boardlab: r.board, fmt: r.fmt } }, blob, { fields: 'id', supportsAllDrives: true });
  }
  return { ok: true, id: f.id };
}
function nellaCartella(id, cartellaId) {
  try {
    const f = Drive.Files.get(id, { fields: 'id,trashed,parents', supportsAllDrives: true });
    return !f.trashed && (f.parents || []).indexOf(cartellaId) >= 0;
  } catch (err) { return false; }
}
function cerca(cartellaId, board, fmt) {
  const q = "'" + cartellaId + "' in parents and trashed = false and appProperties has { key='boardlab' and value='" + board + "' } and appProperties has { key='fmt' and value='" + fmt + "' }";
  const res = Drive.Files.list({ q: q, fields: 'files(id)', pageSize: 1, supportsAllDrives: true, includeItemsFromAllDrives: true });
  return res.files && res.files.length ? res.files[0].id : null;
}

function risposta(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* Da eseguire a mano per collegare un nuovo dispositivo */
function scollegaBoardLab() {
  PropertiesService.getScriptProperties().deleteProperty('CHIAVE');
  Logger.log('Fatto: il prossimo BoardLab che si collega sarà quello autorizzato.');
}
