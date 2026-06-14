(async () => {
  const cfg = window.__FIREBASE_WEB__;
  if (!cfg || !cfg.apiKey) return;

  const [{ initializeApp }, { getFirestore, collection, onSnapshot }] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js'),
  ]);

  const app = initializeApp(cfg);
  const db = getFirestore(app);

  let initial = true;
  onSnapshot(collection(db, 'websiteContent'), () => {
    if (initial) {
      initial = false;
      return;
    }
    console.log('[cms-live] content changed, reloading…');
    location.reload();
  });
})().catch((err) => console.warn('[cms-live] disabled:', err.message));
