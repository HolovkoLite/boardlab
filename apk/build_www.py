# Prepara apk/www (l'app dentro l'APK) a partire dalla versione web nella cartella principale del repository.
# Differenze rispetto alla versione web: niente service worker, niente manifest, niente barra "AGGIORNA",
# contenuto tra le barre di Android (niente viewport-fit=cover) e collegamento alle funzioni native
# (menu Condividi per i file esportati, uscita con il tasto Indietro).
import os, re, shutil, sys, json

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
WWW = os.path.join(HERE, 'www')
NM = os.path.join(HERE, 'node_modules', '@capacitor')

s = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
ver = re.search(r"const APP_VERSION = '([^']+)'", s).group(1)

def rep(old, new):
    global s
    n = s.count(old)
    if n != 1:
        print('MISMATCH', n, repr(old[:90])); sys.exit(1)
    s = s.replace(old, new)

rep('<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">',
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">')
rep('<link rel="manifest" href="manifest.webmanifest">\n', '')
rep('<meta name="mobile-web-app-capable" content="yes">\n', '')
# barra AGGIORNA e service worker: nell'APK gli aggiornamenti arrivano installando la nuova APK
i = s.index('<div id="updBar"'); j = s.index('</script>', i) + len('</script>')
s = s[:i] + s[j:]
s = re.sub(r'#updBar \{[^\n]*\n#updBar button \{[^\n]*\n', '', s)

native = """<script src="capacitor/capacitor.js"></script>
<script src="capacitor/synapse.js"></script>
<script>window.synapse = window.outsystemsSynapse;</script>
<script src="capacitor/app.js"></script>
<script src="capacitor/filesystem.js"></script>
<script src="capacitor/share.js"></script>
<script>
/* App Android: i file esportati passano dal menu Condividi di Android; Indietro nella libreria chiude l'app. */
(function () {
  if (!window.Capacitor || !Capacitor.isNativePlatform || !Capacitor.isNativePlatform()) return;
  const FS = capacitorFilesystemPluginCapacitor.Filesystem, SH = capacitorShare.Share, APP = capacitorApp.App;
  const b64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = () => rej(r.error); r.readAsDataURL(blob); });
  window.blNative = {
    async share(list) {
      try {
        try { await FS.rmdir({ path: 'condividi', directory: 'CACHE', recursive: true }); } catch (_) {}
        const files = [];
        for (const x of list) {
          const name = String(x.name).replace(/[\\\\/:*?"<>|]+/g, '-');
          const r = await FS.writeFile({ path: 'condividi/' + name, data: await b64(x.blob), directory: 'CACHE', recursive: true });
          files.push(r.uri);
        }
        await SH.share({ files, title: list.length === 1 ? list[0].name : 'BoardLab' });
      } catch (e) {
        const m = String((e && e.message) || e || '');
        if (!/cancel/i.test(m)) toast('Non riesco a condividere il file');
      }
    },
    exit() { APP.exitApp(); }
  };
})();
</script>
"""
rep('<title>BoardLab</title>', '<title>BoardLab</title>\n' + native)

if os.path.isdir(WWW): shutil.rmtree(WWW)
os.makedirs(os.path.join(WWW, 'capacitor'))
open(os.path.join(WWW, 'index.html'), 'w', encoding='utf-8').write(s)
for d in ('lib', 'fonts'):
    shutil.copytree(os.path.join(ROOT, d), os.path.join(WWW, d))
os.makedirs(os.path.join(WWW, 'icons'))
shutil.copy(os.path.join(ROOT, 'icons', 'favicon-64.png'), os.path.join(WWW, 'icons', 'favicon-64.png'))
for src, dst in (('core/dist/capacitor.js', 'capacitor.js'), ('synapse/dist/synapse.js', 'synapse.js'), ('app/dist/plugin.js', 'app.js'),
                 ('filesystem/dist/plugin.js', 'filesystem.js'), ('share/dist/plugin.js', 'share.js')):
    shutil.copy(os.path.join(NM, src), os.path.join(WWW, 'capacitor', dst))

# numero di versione per Android: 0.18.0 -> versionName 0.18.0, versionCode 18000
a, b, c = (int(x) for x in ver.split('.'))
json.dump({'versionName': ver, 'versionCode': a * 1000000 + b * 1000 + c}, open(os.path.join(HERE, 'version.json'), 'w'))
print('www', ver)
