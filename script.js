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

// Reservation form
const resForm = document.querySelector('.res-form');
if (resForm) {
  resForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(resForm).entries());

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
    });
  }
}
