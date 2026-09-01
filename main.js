/* Muhammad Ahsan — site behaviour.
   Four jobs: the nav, the picker, the clips, the form. Nothing else. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── NAV ───────────────────────────────────────────────── */
  var nav    = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var menu   = document.getElementById('menu');

  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
  }

  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });

  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      setMenu(false);
      burger.focus();
    }
  });

  var onScroll = function () {
    nav.classList.toggle('is-stuck', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── PICKER ────────────────────────────────────────────────
     Tapping a problem card selects it, carries the label into the
     email, and hands the visitor an editable first draft of their
     own message so the form is never a blank page. */
  var picks   = Array.prototype.slice.call(document.querySelectorAll('.pick'));
  var message = document.getElementById('lead-message');
  var topic   = document.getElementById('lead-topic');
  var contact = document.getElementById('contact');

  picks.forEach(function (pick) {
    pick.addEventListener('click', function () {
      picks.forEach(function (p) { p.setAttribute('aria-pressed', String(p === pick)); });

      topic.value = pick.dataset.topic;

      // Never overwrite words the visitor typed themselves.
      var draft = message.value.trim();
      var isOurs = picks.some(function (p) { return p.dataset.fill === draft; });
      if (!draft || isOurs) message.value = pick.dataset.fill;

      contact.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

      // Land the caret at the end of the draft, once scrolling has settled.
      window.setTimeout(function () {
        message.focus({ preventScroll: true });
        message.setSelectionRange(message.value.length, message.value.length);
      }, reduceMotion ? 0 : 650);
    });
  });

  /* ── CLIPS ─────────────────────────────────────────────── */
  var PLAY  = '<svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var PAUSE = '<svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';

  document.querySelectorAll('.clip').forEach(function (clip) {
    var video = clip.querySelector('video');
    var btn   = clip.querySelector('.play');
    if (!video || !btn) return;

    var name = btn.getAttribute('aria-label').replace(/^Play /, '');

    btn.addEventListener('click', function () {
      document.querySelectorAll('.clip video').forEach(function (v) {
        if (v !== video && !v.paused) v.pause();
      });
      if (video.paused) { video.play(); } else { video.pause(); }
    });

    video.addEventListener('click', function () { btn.click(); });

    video.addEventListener('play', function () {
      clip.classList.add('is-playing');
      btn.innerHTML = PAUSE;
      btn.setAttribute('aria-label', 'Pause ' + name);
    });

    ['pause', 'ended'].forEach(function (evt) {
      video.addEventListener(evt, function () {
        clip.classList.remove('is-playing');
        btn.innerHTML = PLAY;
        btn.setAttribute('aria-label', 'Play ' + name);
      });
    });
  });

  /* ── FORM ──────────────────────────────────────────────── */
  var form  = document.getElementById('lead-form');
  var sent  = document.getElementById('lead-sent');
  var error = document.getElementById('lead-error');
  var send  = form.querySelector('button[type="submit"]');

  function fail(text) {
    error.textContent = text;
    error.hidden = false;
    send.disabled = false;
    send.textContent = 'Send it over';
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    error.hidden = true;

    // novalidate is on the form so we control the message; ask the
    // browser for its verdict, then point at the first field that failed.
    if (!form.checkValidity()) {
      var bad = form.querySelector(':invalid');
      if (bad) {
        bad.focus();
        var label = form.querySelector('label[for="' + bad.id + '"]');
        fail('Please fill in ' + (label ? '“' + label.textContent.trim() + '”' : 'every field') + ' before sending.');
      }
      return;
    }

    send.disabled = true;
    send.textContent = 'Sending…';

    try {
      var res  = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: new FormData(form) });
      var data = await res.json();

      if (data.success) {
        form.hidden = true;
        sent.hidden = false;
        sent.focus();
      } else {
        fail('That didn’t send. Please email ahsanm7911@gmail.com or message +44 7877 418015 instead.');
      }
    } catch (_) {
      fail('That didn’t send — you may be offline. Please try again, or email ahsanm7911@gmail.com.');
    }
  });

  /* ── REVEAL ────────────────────────────────────────────── */
  var targets = document.querySelectorAll('[data-reveal]');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });

  targets.forEach(function (el) { io.observe(el); });
})();
