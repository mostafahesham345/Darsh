/* ============================================================
   Darsh · Showcase — tabbed capability demos.
   Pure static / no backend. Booking data lives in localStorage
   so the Appointments demo and the Dashboard stay in sync.
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- Toast ---------- */
  var toastEl = $('#toast'), toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  /* ---------- Tabs ---------- */
  var tabs = $$('.tab'), panels = $$('.tabpanel');
  var VALID = ['designs', 'appointments', 'store', 'payments', 'invoicing', 'analytics', 'dashboard'];
  function activateTab(name) {
    if (VALID.indexOf(name) === -1) name = 'designs';
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-tab') === name;
      t.classList.toggle('on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    panels.forEach(function (p) { p.hidden = p.id !== 'panel-' + name; });
    history.replaceState(null, '', '#' + name);
    if (name === 'dashboard') renderDashboard();
    if (name === 'appointments') renderAgenda();
    if (name === 'analytics') renderAnalytics();
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      activateTab(t.getAttribute('data-tab'));
      // Land the tab bar right under the sticky nav, every time.
      var bar = $('.tabbar'), nav = $('.sc-nav');
      if (bar) {
        var navH = nav ? nav.offsetHeight : 0;
        window.scrollTo({ top: Math.max(0, bar.offsetTop - navH), behavior: 'smooth' });
      }
    });
  });

  /* ---------- Designs dropdown ---------- */
  var catSelect = $('#catSelect');
  if (catSelect) {
    var catPanels = $$('.cat-panels .cat');
    catSelect.addEventListener('change', function () {
      catPanels.forEach(function (p) { p.hidden = p.id !== catSelect.value; });
    });
  }

  /* ============================================================
     BOOKINGS (shared store)
     ============================================================ */
  var KEY = 'darsh_demo_bookings';
  function loadBookings() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function saveBookings(b) { try { localStorage.setItem(KEY, JSON.stringify(b)); } catch (e) {} }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function prettyDate(s) { var p = s.split('-'); var d = new Date(+p[0], +p[1] - 1, +p[2]); return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); }
  (function seed() {
    if (loadBookings().length) return;
    var t = new Date(); t.setHours(0, 0, 0, 0);
    var d1 = new Date(t); d1.setDate(d1.getDate() + 1);
    var d2 = new Date(t); d2.setDate(d2.getDate() + 3);
    saveBookings([
      { id: 's1', name: 'Sarah Miller', service: 'Consultation (45 min)', date: iso(d1), time: '10:30' },
      { id: 's2', name: 'James Carter', service: 'Haircut (30 min)', date: iso(d2), time: '14:00' }
    ]);
  })();

  /* ============================================================
     APPOINTMENTS
     ============================================================ */
  var SERVICES = ['Consultation (45 min)', 'Haircut (30 min)', 'Table for 2 (dinner)', 'Studio session (1 hr)', 'Quick call (15 min)'];
  var SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '13:00', '13:30', '14:00', '15:00', '16:00'];
  var bkService = $('#bkService'), bkGrid = $('#bkGrid'), bkMonth = $('#bkMonth'), bkSlots = $('#bkSlots'), bkName = $('#bkName');
  var viewDate = new Date(); viewDate.setDate(1);
  var selectedDay = null, selectedSlot = null;
  if (bkService) SERVICES.forEach(function (s) { var o = document.createElement('option'); o.value = s; o.textContent = s; bkService.appendChild(o); });

  function renderCal() {
    if (!bkGrid) return;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    bkMonth.textContent = viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    bkGrid.innerHTML = '';
    var startPad = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    var days = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    for (var i = 0; i < startPad; i++) { var b = document.createElement('span'); b.className = 'cal__cell cal__cell--pad'; bkGrid.appendChild(b); }
    for (var day = 1; day <= days; day++) {
      var cell = document.createElement('button');
      cell.type = 'button'; cell.className = 'cal__cell'; cell.textContent = day;
      var cd = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
      if (cd < today || cd.getDay() === 0) { cell.disabled = true; cell.classList.add('is-off'); }
      if (cd.getTime() === today.getTime()) cell.classList.add('is-today');
      if (selectedDay && iso(cd) === selectedDay) cell.classList.add('is-sel');
      (function (ds) { cell.addEventListener('click', function () { selectedDay = ds; selectedSlot = null; renderCal(); renderSlots(); }); })(iso(cd));
      bkGrid.appendChild(cell);
    }
  }
  function renderSlots() {
    if (!bkSlots) return;
    if (!selectedDay) { bkSlots.innerHTML = '<p class="slots__hint">Pick a day to see available times.</p>'; return; }
    var taken = loadBookings().filter(function (b) { return b.date === selectedDay; }).map(function (b) { return b.time; });
    bkSlots.innerHTML = '';
    SLOTS.forEach(function (s) {
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'slot'; btn.textContent = s;
      if (taken.indexOf(s) > -1) { btn.disabled = true; btn.classList.add('is-taken'); }
      if (selectedSlot === s) btn.classList.add('is-sel');
      btn.addEventListener('click', function () { selectedSlot = s; renderSlots(); });
      bkSlots.appendChild(btn);
    });
  }
  function renderAgenda() {
    var el = $('#bkAgenda'); if (!el) return;
    var todayIso = iso(new Date());
    var list = loadBookings().filter(function (b) { return b.date >= todayIso; }).sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); });
    if (!list.length) { el.innerHTML = '<p class="agenda__empty">No upcoming appointments yet. Book one on the left →</p>'; return; }
    var byDate = {};
    list.forEach(function (b) { (byDate[b.date] = byDate[b.date] || []).push(b); });
    el.innerHTML = Object.keys(byDate).sort().map(function (d) {
      var rows = byDate[d].map(function (b) { return '<div class="agenda__row"><span class="agenda__time">' + b.time + '</span><span class="agenda__info"><strong>' + escapeHtml(b.name) + '</strong><em>' + escapeHtml(b.service) + '</em></span></div>'; }).join('');
      return '<div class="agenda__day"><div class="agenda__date">' + prettyDate(d) + '</div>' + rows + '</div>';
    }).join('');
  }
  var bkPrev = $('#bkPrev'), bkNext = $('#bkNext'), bkBook = $('#bkBook');
  if (bkPrev) bkPrev.addEventListener('click', function () { viewDate.setMonth(viewDate.getMonth() - 1); renderCal(); });
  if (bkNext) bkNext.addEventListener('click', function () { viewDate.setMonth(viewDate.getMonth() + 1); renderCal(); });
  if (bkBook) bkBook.addEventListener('click', function () {
    var name = (bkName.value || '').trim();
    if (!name) { toast('Please enter your name.'); bkName.focus(); return; }
    if (!selectedDay) { toast('Please pick a day.'); return; }
    if (!selectedSlot) { toast('Please pick a time.'); return; }
    var list = loadBookings();
    list.push({ id: 'b' + Date.now(), name: name, service: bkService.value, date: selectedDay, time: selectedSlot });
    saveBookings(list);
    toast('✓ Booked ' + prettyDate(selectedDay) + ' at ' + selectedSlot);
    selectedSlot = null; bkName.value = '';
    renderSlots(); renderAgenda(); renderDashboard();
  });

  /* ============================================================
     DASHBOARD
     ============================================================ */
  var dashNav = $$('.dash__navbtn');
  dashNav.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var view = btn.getAttribute('data-view');
      dashNav.forEach(function (b) { b.classList.toggle('on', b === btn); });
      $$('.dash__view').forEach(function (v) { v.hidden = v.getAttribute('data-panel') !== view; });
    });
  });
  var chartDrawn = false;
  function renderDashboard() {
    var books = loadBookings(), cnt = books.length;
    var setTxt = function (sel, v) { var e = $(sel); if (e) e.textContent = v; };
    setTxt('#dashBookCount', cnt); setTxt('#kpiBookings', cnt);
    var rows = $('#dashBookRows');
    if (rows) {
      var sorted = books.slice().sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); });
      rows.innerHTML = sorted.length ? sorted.map(function (b) { return '<tr><td>' + escapeHtml(b.name) + '</td><td>' + escapeHtml(b.service) + '</td><td>' + prettyDate(b.date) + '</td><td>' + b.time + '</td><td><span class="pill pill--ok">Confirmed</span></td></tr>'; }).join('') : '<tr><td colspan="5" class="dtable__empty">No bookings yet — try the Appointments tab.</td></tr>';
    }
    if (!chartDrawn) {
      var chart = $('#dashChart');
      if (chart) {
        var data = [42, 58, 47, 71, 66, 88, 63], labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'], max = Math.max.apply(null, data);
        chart.innerHTML = data.map(function (v, i) { return '<div class="chart__col"><div class="chart__bar" style="height:' + Math.round((v / max) * 100) + '%"></div><span>' + labels[i] + '</span></div>'; }).join('');
        chartDrawn = true;
      }
    }
  }
  function bind(inputSel, outSel) { var inp = $(inputSel), out = $(outSel); if (inp && out) inp.addEventListener('input', function () { out.textContent = inp.value; }); }
  bind('#edTitle', '#pvTitle'); bind('#edSub', '#pvSub'); bind('#edCta', '#pvCta'); bind('#edAbout', '#pvAbout');
  var edColor = $('#edColor');
  if (edColor) {
    var applyColor = function () { var c = edColor.value, btn = $('#pvCta'), badge = $('#pvBadge'), mini = $('#edMini'); if (btn) btn.style.background = c; if (badge) badge.style.color = c; if (mini) mini.style.setProperty('--pv', c); };
    edColor.addEventListener('input', applyColor); applyColor();
  }
  var edSave = $('#edSave');
  if (edSave) edSave.addEventListener('click', function () { toast('✓ Changes saved & published'); });

  /* ============================================================
     STORE
     ============================================================ */
  var PRODUCTS = [
    { id: 'p1', name: 'Flat White', price: 4.5, c1: '#c9a35d', c2: '#6f4e37' },
    { id: 'p2', name: 'Cold Brew', price: 5.0, c1: '#3a2a1f', c2: '#8a5a3b' },
    { id: 'p3', name: 'Croissant', price: 3.75, c1: '#e8c98a', c2: '#c2884a' },
    { id: 'p4', name: 'Avocado Toast', price: 9.0, c1: '#7bbf6a', c2: '#3d7a3a' },
    { id: 'p5', name: 'Blueberry Muffin', price: 3.5, c1: '#6a7bbf', c2: '#3a4a8a' },
    { id: 'p6', name: 'Matcha Latte', price: 5.5, c1: '#9bd08a', c2: '#4a8a5a' }
  ];
  var cart = {};
  var storeGrid = $('#storeGrid');
  if (storeGrid) {
    storeGrid.innerHTML = PRODUCTS.map(function (p) {
      return '<div class="product"><div class="product__img" style="background:linear-gradient(135deg,' + p.c1 + ',' + p.c2 + ')"></div><div class="product__row"><span class="product__name">' + p.name + '</span><span class="product__price">$' + p.price.toFixed(2) + '</span></div><button class="product__add" data-add="' + p.id + '">Add to cart</button></div>';
    }).join('');
    storeGrid.addEventListener('click', function (e) {
      var id = e.target.getAttribute && e.target.getAttribute('data-add');
      if (!id) return; cart[id] = (cart[id] || 0) + 1; renderCart(); toast('Added to cart');
    });
  }
  function renderCart() {
    var wrap = $('#cartItems'), totalEl = $('#cartTotal'), checkout = $('#checkout');
    if (!wrap) return;
    var ids = Object.keys(cart).filter(function (k) { return cart[k] > 0; });
    if (!ids.length) { wrap.innerHTML = '<p class="cart__empty">Your cart is empty — add something tasty.</p>'; if (totalEl) totalEl.textContent = '$0.00'; if (checkout) checkout.disabled = true; return; }
    var total = 0;
    wrap.innerHTML = ids.map(function (id) {
      var p = PRODUCTS.filter(function (x) { return x.id === id; })[0]; var line = p.price * cart[id]; total += line;
      return '<div class="citem"><span class="citem__name">' + p.name + '</span><span class="citem__qty"><button data-dec="' + id + '">−</button><b>' + cart[id] + '</b><button data-inc="' + id + '">+</button></span><span class="citem__price">$' + line.toFixed(2) + '</span></div>';
    }).join('');
    if (totalEl) totalEl.textContent = '$' + total.toFixed(2);
    if (checkout) checkout.disabled = false;
  }
  var cartItems = $('#cartItems');
  if (cartItems) cartItems.addEventListener('click', function (e) {
    var inc = e.target.getAttribute('data-inc'), dec = e.target.getAttribute('data-dec');
    if (inc) { cart[inc]++; renderCart(); } if (dec) { cart[dec] = Math.max(0, cart[dec] - 1); renderCart(); }
  });
  var checkout = $('#checkout');
  if (checkout) checkout.addEventListener('click', function () { cart = {}; renderCart(); toast('✓ Order placed! (demo — no real charge)'); });

  /* ============================================================
     PAYMENTS (Stripe simulator)
     ============================================================ */
  var payCard = $('#payCard'), payExp = $('#payExp'), payCvc = $('#payCvc'), payName = $('#payName'), payBtn = $('#payBtn'), payBrand = $('#payBrand');
  function fmtCard() {
    var v = payCard.value.replace(/\D/g, '').slice(0, 16);
    payCard.value = v.replace(/(.{4})/g, '$1 ').trim();
    if (payBrand) payBrand.textContent = v[0] === '4' ? 'VISA' : v[0] === '5' ? 'MC' : v[0] === '3' ? 'AMEX' : 'CARD';
  }
  if (payCard) payCard.addEventListener('input', fmtCard);
  if (payExp) payExp.addEventListener('input', function () { var v = payExp.value.replace(/\D/g, '').slice(0, 4); payExp.value = v.length > 2 ? v.slice(0, 2) + ' / ' + v.slice(2) : v; });
  if (payCvc) payCvc.addEventListener('input', function () { payCvc.value = payCvc.value.replace(/\D/g, '').slice(0, 4); });

  var payHistory = [
    { name: 'Sarah Miller', amount: 49, last4: '4242', ago: '2h ago' },
    { name: 'David Chen', amount: 120, last4: '5588', ago: 'Yesterday' },
    { name: 'Aisha Khan', amount: 32, last4: '0341', ago: '2 days ago' }
  ];
  function renderPayList() {
    var el = $('#payList'); if (!el) return;
    el.innerHTML = payHistory.map(function (p) {
      return '<div class="payrow"><span class="payrow__ic">✓</span><span class="payrow__info"><strong>' + escapeHtml(p.name) + '</strong><em>•••• ' + p.last4 + ' · ' + p.ago + '</em></span><span class="payrow__amt">$' + p.amount.toFixed(2) + '</span></div>';
    }).join('');
  }
  if (payBtn) payBtn.addEventListener('click', function () {
    var num = (payCard.value || '').replace(/\s/g, '');
    if (num.length < 15) { toast('Enter a valid card number (try 4242…)'); payCard.focus(); return; }
    if (!payExp.value || (payCvc.value || '').length < 3) { toast('Fill in expiry and CVC'); return; }
    var lbl = $('.pay__btnlabel');
    payBtn.disabled = true; payBtn.classList.add('is-loading'); lbl.textContent = 'Processing…';
    setTimeout(function () {
      payBtn.classList.remove('is-loading'); payBtn.classList.add('is-done'); lbl.textContent = '✓ Payment successful';
      toast('✓ $49.00 charged (demo — no real card)');
      payHistory.unshift({ name: (payName.value || 'Jane Doe'), amount: 49, last4: num.slice(-4), ago: 'Just now' });
      renderPayList();
      setTimeout(function () {
        payBtn.disabled = false; payBtn.classList.remove('is-done'); lbl.textContent = 'Pay $49.00';
        payCard.value = ''; payExp.value = ''; payCvc.value = ''; payName.value = '';
      }, 2400);
    }, 1500);
  });

  /* ============================================================
     INVOICING
     ============================================================ */
  var invItemsEl = $('#invItems'), invClient = $('#invClient');
  var invItems = [
    { d: 'Website design & build', q: 1, p: 1800 },
    { d: 'Hosting & maintenance (1 yr)', q: 1, p: 240 }
  ];
  function invTotal() { return invItems.reduce(function (t, it) { return t + (Number(it.q) || 0) * (Number(it.p) || 0); }, 0); }
  function renderInvForm() {
    if (!invItemsEl) return;
    invItemsEl.innerHTML = invItems.map(function (it, i) {
      return '<div class="inv__item"><input class="inv__desc" data-i="' + i + '" data-k="d" value="' + escapeHtml(it.d) + '" /><input class="inv__qty" data-i="' + i + '" data-k="q" type="number" min="0" value="' + it.q + '" /><input class="inv__price" data-i="' + i + '" data-k="p" type="number" min="0" value="' + it.p + '" /><button class="inv__del" data-del="' + i + '" aria-label="Remove">×</button></div>';
    }).join('');
  }
  function renderInvPreview() {
    var rows = $('#ivRows'), t = invTotal();
    if (rows) rows.innerHTML = invItems.map(function (it) {
      return '<tr><td>' + escapeHtml(it.d || '—') + '</td><td class="num">' + it.q + '</td><td class="num">$' + (Number(it.p) || 0).toFixed(2) + '</td><td class="num">$' + ((Number(it.q) || 0) * (Number(it.p) || 0)).toFixed(2) + '</td></tr>';
    }).join('');
    var ivC = $('#ivClient'); if (ivC) ivC.textContent = invClient ? (invClient.value || 'Client') : 'Client';
    var setT = function (sel) { var e = $(sel); if (e) e.textContent = '$' + t.toFixed(2); };
    setT('#invTotal'); setT('#ivTotal');
  }
  function renderInv() { renderInvForm(); renderInvPreview(); }
  if (invItemsEl) {
    invItemsEl.addEventListener('input', function (e) {
      var i = e.target.getAttribute('data-i'), k = e.target.getAttribute('data-k');
      if (i == null) return;
      invItems[i][k] = k === 'd' ? e.target.value : e.target.value;
      renderInvPreview();
    });
    invItemsEl.addEventListener('click', function (e) {
      var del = e.target.getAttribute('data-del');
      if (del != null) { invItems.splice(+del, 1); renderInv(); }
    });
  }
  var invAdd = $('#invAdd');
  if (invAdd) invAdd.addEventListener('click', function () { invItems.push({ d: 'New item', q: 1, p: 100 }); renderInv(); });
  if (invClient) invClient.addEventListener('input', renderInvPreview);
  var invSend = $('#invSend');
  if (invSend) invSend.addEventListener('click', function () { toast('✓ Invoice sent to ' + (invClient.value || 'client') + ' · $' + invTotal().toFixed(2)); });

  /* ============================================================
     ANALYTICS
     ============================================================ */
  var anDrawn = false;
  function renderAnalytics() {
    if (anDrawn) return;
    var area = $('#anArea');
    if (area) {
      var data = [12, 15, 14, 19, 17, 25]; // $k over 6 months
      var labels = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
      var W = 320, H = 130, pad = 6, max = 28;
      var pts = data.map(function (v, i) { return [pad + (i * (W - pad * 2)) / (data.length - 1), H - pad - (v / max) * (H - pad * 2)]; });
      var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
      var area2 = line + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (H - pad) + ' L' + pts[0][0].toFixed(1) + ' ' + (H - pad) + ' Z';
      var dots = pts.map(function (p) { return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3" />'; }).join('');
      area.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" class="area-svg"><defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(247,226,126,0.55)"/><stop offset="1" stop-color="rgba(247,226,126,0)"/></linearGradient></defs><path d="' + area2 + '" fill="url(#ag)"/><path d="' + line + '" fill="none" stroke="#e0a63a" stroke-width="2.5"/><g fill="#e0a63a">' + dots + '</g></svg><div class="area-x">' + labels.map(function (l) { return '<span>' + l + '</span>'; }).join('') + '</div>';
    }
    var sources = $('#anSources');
    if (sources) {
      var src = [['Google', 48, '#4285f4'], ['Direct', 22, '#0a1f44'], ['Instagram', 18, '#e1306c'], ['Referral', 12, '#1f9e5a']];
      sources.innerHTML = src.map(function (s) {
        return '<div class="an-src"><div class="an-src__top"><span>' + s[0] + '</span><b>' + s[1] + '%</b></div><div class="an-src__bar"><i style="width:' + s[1] + '%;background:' + s[2] + '"></i></div></div>';
      }).join('');
    }
    var top = $('#anTop');
    if (top) {
      var prod = [['Flat White', texts(842), '$3,789', 22], ['Cold Brew', texts(651), '$3,255', 18], ['Croissant', texts(1204), '$4,515', 26], ['Avocado Toast', texts(388), '$3,492', 20]];
      top.innerHTML = prod.map(function (p) {
        return '<tr><td>' + p[0] + '</td><td>' + p[1] + '</td><td>' + p[2] + '</td><td><span class="pill pill--ok">' + p[3] + '%</span></td></tr>';
      }).join('');
    }
    anDrawn = true;
  }
  function texts(n) { return n.toLocaleString(); }

  /* ---------- Init ---------- */
  if (bkGrid) { renderCal(); renderSlots(); renderAgenda(); }
  renderCart();
  renderPayList();
  renderInv();
  renderDashboard();
  activateTab((location.hash || '').replace('#', '') || 'designs');
})();
