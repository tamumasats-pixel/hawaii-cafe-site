// Nav background on scroll
const nav = document.querySelector('.nav');
if (nav) {
  const toggleNav = () => {
    if (window.scrollY > 60) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  toggleNav();
  window.addEventListener('scroll', toggleNav);
}

// Mobile menu toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav ul.links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
}

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));
}

// Menu tab filter
const tabButtons = document.querySelectorAll('.menu-tabs button');
const menuCards = document.querySelectorAll('.menu-card');
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.cat;
    menuCards.forEach(card => {
      card.style.display = (cat === 'all' || card.dataset.cat === cat) ? '' : 'none';
    });
  });
});

// Lightbox for gallery
const lightbox = document.querySelector('.lightbox');
const lightboxImg = document.querySelector('.lightbox img');
document.querySelectorAll('.gallery-grid figure').forEach(fig => {
  fig.addEventListener('click', () => {
    const img = fig.querySelector('img');
    if (lightbox && lightboxImg && img) {
      lightboxImg.src = img.src.replace(/w=\d+/, 'w=1600');
      lightbox.classList.add('open');
    }
  });
});
const lightboxClose = document.querySelector('.lightbox-close');
if (lightbox) {
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target === lightboxClose) lightbox.classList.remove('open');
  });
}

// ---------- Reservation availability (client-side demo simulation) ----------
// There is no backend on this static site, so "availability" is simulated:
// a deterministic pseudo-random capacity per date+time, minus bookings the
// current browser has made (stored in localStorage) so a slot really does
// disappear after you book it in this demo.
function hashSlot(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) >>> 0; }
  return h;
}
function getLocalBookings() {
  try { return JSON.parse(localStorage.getItem('aloha_reservations') || '[]'); }
  catch { return []; }
}
function countLocalBookings(date, time) {
  return getLocalBookings().filter(b => b.date === date && b.time === time).length;
}
function buildTimeSlots() {
  const slots = [];
  for (let h = 9; h <= 19; h++) {
    for (let m of [0, 30]) {
      if (h === 19 && m === 30) continue;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}
function slotStatus(date, time) {
  const capacity = 2 + (hashSlot(date + time) % 4); // 2〜5 (demo baseline)
  const remaining = capacity - countLocalBookings(date, time);
  if (remaining <= 0) return { status: 'full', remaining: 0 };
  if (remaining <= 2) return { status: 'few', remaining };
  return { status: 'free', remaining };
}

const slotGrid = document.getElementById('slot-grid');
const dateInput = document.getElementById('res-date');
const timeHidden = document.getElementById('res-time');
const submitBtn = document.getElementById('res-submit-btn');

function renderSlots(date) {
  if (!slotGrid) return;
  timeHidden.value = '';
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '時間帯を選択してください'; }
  if (!date) {
    slotGrid.innerHTML = '<p class="slot-hint">↑ まずご来店日を選択してください</p>';
    return;
  }
  const slots = buildTimeSlots();
  slotGrid.innerHTML = '';
  slots.forEach(time => {
    const { status, remaining } = slotStatus(date, time);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'slot-btn ' + status;
    btn.disabled = status === 'full';
    const label = status === 'full' ? '満席' : status === 'few' ? `残り${remaining}` : '空きあり';
    btn.innerHTML = `<span class="t">${time}</span><span class="s">${label}</span>`;
    btn.addEventListener('click', () => {
      slotGrid.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      timeHidden.value = time;
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = `${time} で予約リクエストを作成する`; }
    });
    slotGrid.appendChild(btn);
  });
}
if (dateInput) {
  const today = new Date().toISOString().slice(0, 10);
  dateInput.min = today;
  dateInput.value = today;
  renderSlots(today);
  dateInput.addEventListener('change', () => renderSlots(dateInput.value));
}

// Reservation form
const resForm = document.querySelector('.res-form');
if (resForm) {
  resForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!timeHidden.value) return;
    const data = Object.fromEntries(new FormData(resForm).entries());

    // Record the booking locally so this slot shows reduced availability next time.
    const bookings = getLocalBookings();
    bookings.push({ date: data.date, time: data.time });
    localStorage.setItem('aloha_reservations', JSON.stringify(bookings));

    const seatLabel = { window: '窓際席', terrace: 'テラス席', counter: 'カウンター席', anywhere: 'おまかせ' }[data.seat] || data.seat;

    const summary = document.querySelector('.res-summary');
    summary.innerHTML = `
      <div><span>お名前</span><span>${data.name} 様</span></div>
      <div><span>ご来店日</span><span>${data.date}</span></div>
      <div><span>時間</span><span>${data.time}</span></div>
      <div><span>人数</span><span>${data.guests}名</span></div>
      <div><span>お席</span><span>${seatLabel}</span></div>
      <div><span>電話番号</span><span>${data.phone}</span></div>
      <div><span>メール</span><span>${data.email}</span></div>
      ${data.notes ? `<div><span>ご要望</span><span>${data.notes}</span></div>` : ''}
    `;

    document.querySelector('.res-form').classList.add('hide');
    document.querySelector('.res-confirm').classList.add('show');

    // Prepares a pre-filled email to the cafe so the request actually reaches someone
    // (this is a static site with no server, so a real booking system is not connected).
    const subject = encodeURIComponent('【ご予約リクエスト】' + data.name + '様 ' + data.date + ' ' + data.time);
    const body = encodeURIComponent(
      `Aloha Sun Café ご予約リクエスト\n\n` +
      `お名前: ${data.name}\n` +
      `日付: ${data.date}\n` +
      `時間: ${data.time}\n` +
      `人数: ${data.guests}名\n` +
      `お席の希望: ${seatLabel}\n` +
      `電話番号: ${data.phone}\n` +
      `メールアドレス: ${data.email}\n` +
      `ご要望: ${data.notes || 'なし'}\n`
    );
    const mailLink = document.querySelector('.res-mail-link');
    if (mailLink) {
      mailLink.href = `mailto:hello@alohasuncafe.example.com?subject=${subject}&body=${body}`;
    }

    window.scrollTo({ top: document.querySelector('.res-wrap').offsetTop - 100, behavior: 'smooth' });
  });

  const resetBtn = document.querySelector('.res-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resForm.reset();
      document.querySelector('.res-form').classList.remove('hide');
      document.querySelector('.res-confirm').classList.remove('show');
      if (dateInput) {
        dateInput.value = dateInput.value || new Date().toISOString().slice(0, 10);
        renderSlots(dateInput.value);
      }
    });
  }
}

// ---------- Mobile order (takeout) page ----------
const orderCards = document.querySelectorAll('.order-card');
if (orderCards.length) {
  const cart = {}; // id -> { name, price, qty }

  const orderTabButtons = document.querySelectorAll('.order-tabs button');
  orderTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      orderTabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      orderCards.forEach(card => {
        card.style.display = (cat === 'all' || card.dataset.cat === cat) ? '' : 'none';
      });
    });
  });

  function renderCart() {
    const itemsEl = document.querySelector('.cart-items');
    const emptyEl = document.querySelector('.cart-empty');
    const totalEl = document.querySelector('.cart-total .amount');
    const checkoutBtn = document.querySelector('.order-checkout-btn');
    const ids = Object.keys(cart);

    if (!ids.length) {
      itemsEl.innerHTML = '';
      emptyEl.style.display = 'block';
      if (checkoutBtn) checkoutBtn.disabled = true;
    } else {
      emptyEl.style.display = 'none';
      if (checkoutBtn) checkoutBtn.disabled = false;
      itemsEl.innerHTML = ids.map(id => {
        const it = cart[id];
        return `
          <div class="cart-item" data-id="${id}">
            <div>
              <div class="name">${it.name}</div>
              <div class="sub">¥${it.price.toLocaleString()} × ${it.qty}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <div class="qty-stepper">
                <button type="button" class="cart-minus">−</button>
                <span>${it.qty}</span>
                <button type="button" class="cart-plus">＋</button>
              </div>
              <button type="button" class="remove cart-remove">削除</button>
            </div>
          </div>`;
      }).join('');
    }

    const total = ids.reduce((sum, id) => sum + cart[id].price * cart[id].qty, 0);
    if (totalEl) totalEl.textContent = '¥' + total.toLocaleString();

    itemsEl.querySelectorAll('.cart-item').forEach(row => {
      const id = row.dataset.id;
      row.querySelector('.cart-plus').addEventListener('click', () => { cart[id].qty++; renderCart(); });
      row.querySelector('.cart-minus').addEventListener('click', () => {
        cart[id].qty--;
        if (cart[id].qty <= 0) delete cart[id];
        renderCart();
      });
      row.querySelector('.cart-remove').addEventListener('click', () => { delete cart[id]; renderCart(); });
    });
  }

  orderCards.forEach(card => {
    const id = card.dataset.id;
    const name = card.dataset.name;
    const price = Number(card.dataset.price);
    const addBtn = card.querySelector('.qty-add');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (!cart[id]) cart[id] = { name, price, qty: 0 };
        cart[id].qty++;
        renderCart();
        addBtn.textContent = 'カートに追加済み ✓';
        setTimeout(() => { addBtn.textContent = 'カートに追加'; }, 900);
      });
    }
  });

  renderCart();

  // Populate pickup time options: now+15min, every 10min, next 3 hours
  const pickupSelect = document.getElementById('pickup-time');
  if (pickupSelect) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15 - (now.getMinutes() % 10));
    for (let i = 0; i < 18; i++) {
      const t = new Date(now.getTime() + i * 10 * 60000);
      const label = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
      const opt = document.createElement('option');
      opt.value = label;
      opt.textContent = i === 0 ? `${label}（最短）` : label;
      pickupSelect.appendChild(opt);
    }
  }

  const orderForm = document.querySelector('.order-form');
  if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const ids = Object.keys(cart);
      if (!ids.length) return;
      const data = Object.fromEntries(new FormData(orderForm).entries());
      const total = ids.reduce((sum, id) => sum + cart[id].price * cart[id].qty, 0);

      const lines = ids.map(id => `・${cart[id].name} × ${cart[id].qty}（¥${(cart[id].price * cart[id].qty).toLocaleString()}）`).join('\n');
      const summaryHtml = ids.map(id =>
        `<div><span>${cart[id].name} × ${cart[id].qty}</span><span>¥${(cart[id].price * cart[id].qty).toLocaleString()}</span></div>`
      ).join('') + `<div><span>合計</span><span>¥${total.toLocaleString()}</span></div>`;

      document.querySelector('.order-summary').innerHTML = summaryHtml;
      document.querySelector('.order-form-wrap').classList.add('hide');
      document.querySelector('.order-confirm').classList.add('show');

      const subject = encodeURIComponent('【モバイルオーダー】' + data.name + '様 ' + data.pickup);
      const body = encodeURIComponent(
        `Aloha Sun Café モバイルオーダー（テイクアウト）\n\n` +
        `お名前: ${data.name}\n` +
        `電話番号: ${data.phone}\n` +
        `受け取り時間: ${data.pickup}\n\n` +
        `--- ご注文内容 ---\n${lines}\n合計: ¥${total.toLocaleString()}\n\n` +
        `${data.notes ? 'ご要望: ' + data.notes : ''}`
      );
      const mailLink = document.querySelector('.order-mail-link');
      if (mailLink) {
        mailLink.href = `mailto:hello@alohasuncafe.example.com?subject=${subject}&body=${body}`;
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    const orderResetBtn = document.querySelector('.order-reset');
    if (orderResetBtn) {
      orderResetBtn.addEventListener('click', () => {
        Object.keys(cart).forEach(k => delete cart[k]);
        renderCart();
        orderForm.reset();
        document.querySelector('.order-form-wrap').classList.remove('hide');
        document.querySelector('.order-confirm').classList.remove('show');
      });
    }
  }
}
