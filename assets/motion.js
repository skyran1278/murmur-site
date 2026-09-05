(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const demo = document.querySelector('.demo');
  const active = new Map();
  const pending = new Set();
  const ease = 'cubic-bezier(.22, 1, .36, 1)';
  let observer;

  // Motion is progressive enhancement: the HTML is visible without this file,
  // and every animation returns to the original styles when it ends or is canceled.
  if (typeof Element.prototype.animate !== 'function' || typeof window.IntersectionObserver !== 'function') return;

  function animate(element, frames, options = {}) {
    if (!element || reducedMotion.matches || document.hidden) return;
    const animation = element.animate(frames, {
      duration: 700,
      easing: ease,
      fill: 'backwards',
      ...options,
    });
    active.set(animation, element);
    const release = () => active.delete(animation);
    animation.finished.then(release, release);
    return animation;
  }

  function cancelWithin(container) {
    active.forEach((element, animation) => {
      if (container.contains(element)) {
        animation.cancel();
        active.delete(animation);
      }
    });
  }

  function drawLine(path, delay = 0) {
    if (!path) return;
    const length = path.getTotalLength();
    animate(path, [
      { strokeDasharray: `${length} ${length}`, strokeDashoffset: length },
      { strokeDasharray: `${length} ${length}`, strokeDashoffset: 0 },
    ], { duration: 850, delay });
  }

  function greetWithAWave(delay) {
    demo.querySelectorAll('#wave-bars line').forEach((bar, index) => {
      animate(bar, [
        { transform: 'scaleY(.55)' },
        { transform: 'scaleY(1.12)', offset: .45 },
        { transform: 'scaleY(1)' },
      ], { duration: 950, delay: delay + index * 12, easing: 'ease-in-out' });
    });
  }

  function reveal(element, withMotion = true) {
    if (!pending.has(element)) return;
    pending.delete(element);
    observer.unobserve(element);
    element.classList.remove('motion-pending');
    element.classList.add('is-revealed');
    if (!withMotion) return;

    const delay = Number(element.dataset.motionDelay || 0);
    const base = getComputedStyle(element).transform;
    const transform = base === 'none' ? '' : base;
    animate(element, [
      { opacity: 0, transform: `translateY(18px) ${transform}`.trim() },
      { opacity: 1, transform: base },
    ], { delay });

    if (element.classList.contains('voice-card')) greetWithAWave(delay + 160);
    if (element.classList.contains('journey-thread')) drawLine(element.querySelector('path'), delay + 100);
    if (element.classList.contains('device-scene')) {
      for (const [index, selector] of ['.phone-device', '.watch-device'].entries()) {
        const device = element.querySelector(selector);
        const resting = getComputedStyle(device).transform;
        animate(device, [
          { transform: `translateY(${index ? 22 : 12}px) rotate(${index ? -3 : 2}deg) ${resting}` },
          { transform: resting },
        ], { duration: 1000, delay: delay + index * 140 });
      }
      drawLine(element.querySelector('.caption-phone path'), delay + 300);
    }
  }

  function revealWithin(container) {
    pending.forEach(element => {
      if (container.contains(element)) reveal(element, false);
    });
    cancelWithin(container);
  }

  function stopMotion() {
    pending.forEach(element => reveal(element, false));
    observer?.disconnect();
    cancelWithin(document.documentElement);
  }

  function prepareEntrances() {
    if (reducedMotion.matches) return;
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) reveal(entry.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -24px 0px' });

    const groups = [
      ['.hero-copy > *', 85],
      ['.demo-topline, .voice-card, .journey-thread, .note-card, .demo-controls', 95],
      ['.promise-strip, .section-heading', 0],
      ['.steps li', 100],
      ['.everyday-copy > *', 65],
      ['.device-scene', 0],
      ['.privacy-grid > div:first-child', 0],
      ['.privacy-facts > div', 90],
      ['.faq-section > div', 90],
      ['.closing-top, .closing-row', 100],
    ];
    groups.forEach(([selector, stagger]) => {
      document.querySelectorAll(selector).forEach((element, index) => {
        element.dataset.motionDelay = index * stagger;
        // A restored scroll position or an anchor may put content above the viewport.
        // Keep that content visible instead of waiting for an intersection that may never come.
        if (element.getBoundingClientRect().bottom <= 0) {
          element.classList.add('is-revealed');
          return;
        }
        pending.add(element);
        element.classList.add('motion-pending');
        observer.observe(element);
      });
    });
  }

  demo.addEventListener('murmur:demo-start', () => revealWithin(demo));
  demo.addEventListener('murmur:demo-transcribing', () => {
    drawLine(demo.querySelector('.journey-thread path'));
    animate(demo.querySelector('.note-transcript'), [
      { opacity: .3, transform: 'translateY(4px)' },
      { opacity: 1, transform: 'none' },
    ], { duration: 550, delay: 100 });
  });
  demo.addEventListener('murmur:demo-saved', () => {
    const note = demo.querySelector('.note-card');
    const resting = getComputedStyle(note).transform;
    animate(note, [
      { transform: `translateY(7px) ${resting}` },
      { transform: resting },
    ], { duration: 600 });
    animate(demo.querySelector('.saved-status .icon'), [
      { opacity: 0, transform: 'scale(.55)' },
      { opacity: 1, transform: 'scale(1.12)', offset: .65 },
      { opacity: 1, transform: 'scale(1)' },
    ], { duration: 450, delay: 100 });
  });
  demo.addEventListener('murmur:destination-changed', () => {
    const status = demo.querySelector('#note-status');
    cancelWithin(status);
    animate(status, [
      { opacity: .2, transform: 'translateY(3px)' },
      { opacity: 1, transform: 'none' },
    ], { duration: 250 });
  });
  document.querySelectorAll('.faq-list details').forEach(details => {
    details.addEventListener('toggle', () => {
      const answer = details.querySelector('.faq-answer');
      cancelWithin(answer);
      if (details.open) animate(answer, [
        { opacity: 0, transform: 'translateY(-5px)' },
        { opacity: 1, transform: 'none' },
      ], { duration: 250 });
    });
  });

  // A keyboard user must never focus a control that is still fading in.
  document.addEventListener('focusin', event => {
    const section = event.target.closest('[data-motion-delay]');
    if (section) revealWithin(section);
  });
  document.addEventListener('visibilitychange', () => {
    document.documentElement.classList.toggle('page-hidden', document.hidden);
    if (document.hidden) cancelWithin(document.documentElement);
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) stopMotion();
  });

  prepareEntrances();
})();
