(() => {
  const demo = document.querySelector('.demo');
  const play = document.querySelector('#demo-play');
  const playLabel = play.querySelector('span');
  const noteStatus = document.querySelector('#note-status');
  const voiceStatus = document.querySelector('#voice-status');
  const announcement = document.querySelector('#demo-announcement');
  const destinations = [...document.querySelectorAll('[data-destination]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let destination = 'Notion';
  let sequence = 0;
  let timers = [];

  // This is a local illustration of the flow. It never accesses the microphone,
  // plays audio, or makes a network request.
  const examples = [
    { quote: 'Maybe the best ideas come when you take the long way home.', title: 'Maybe the best ideas come…' },
    { quote: 'A ceramics workshop for Mom’s birthday. She’d love making something with her hands.', title: 'A ceramics workshop for Mom’s birthday.' },
    { quote: 'Leave a little space in the weekend for something unplanned.', title: 'Leave a little space in the weekend…' },
  ];

  const bars = document.querySelector('#wave-bars');
  const heights = [4, 10, 18, 8, 26, 16, 38, 26, 46, 32, 20, 36, 52, 40, 26, 14, 28, 38, 20, 12, 24, 38, 54, 44, 30, 16, 26, 40, 26, 14, 20, 34, 46, 32, 22, 36, 26, 14, 22, 32, 18, 26, 12, 20, 10, 16, 8, 14, 6, 4];
  bars.replaceChildren(...heights.map((height, index) => {
    const bar = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    bar.setAttribute('x1', 4 + index * 8);
    bar.setAttribute('x2', 4 + index * 8);
    bar.setAttribute('y1', 31 - height / 2);
    bar.setAttribute('y2', 31 + height / 2);
    bar.style.animationDelay = `${-(index % 7) * 0.09}s`;
    bar.style.animationDuration = `${0.32 + (index % 5) * 0.09}s`;
    return bar;
  }));

  function clearTimers() {
    timers.forEach(window.clearTimeout);
    timers = [];
  }

  function finish() {
    clearTimers();
    demo.dataset.stage = 'saved';
    noteStatus.textContent = `Saved to ${destination}`;
    voiceStatus.textContent = 'A thought, captured.';
    play.disabled = false;
    playLabel.textContent = 'Try another thought';
    announcement.textContent = `Example complete. The original audio and transcript are saved to ${destination}.`;
  }

  play.addEventListener('click', () => {
    clearTimers();
    const example = examples[sequence % examples.length];
    const number = String(sequence % examples.length + 1).padStart(3, '0');
    document.querySelector('#voice-quote').textContent = `“${example.quote}”`;
    document.querySelector('#note-title').textContent = example.title;
    document.querySelector('#note-transcript').textContent = example.quote;
    document.querySelector('#note-file').textContent = `idea-${number}.m4a`;
    document.querySelector('.note-topline > .mono').textContent = `IDEA ${number}`;
    sequence += 1;
    announcement.textContent = '';

    if (reducedMotion.matches) {
      finish();
      return;
    }

    demo.dataset.stage = 'recording';
    voiceStatus.textContent = 'Capturing the thought…';
    noteStatus.textContent = 'Audio saved on iPhone';
    play.disabled = true;
    playLabel.textContent = 'A thought becomes a note…';
    timers.push(window.setTimeout(() => {
      demo.dataset.stage = 'transcribing';
      voiceStatus.textContent = 'Transcribing on your iPhone…';
      noteStatus.textContent = 'Turning voice into words…';
    }, 1100));
    timers.push(window.setTimeout(finish, 2300));
  });

  destinations.forEach(button => {
    button.addEventListener('click', () => {
      destination = button.dataset.destination;
      destinations.forEach(option => option.setAttribute('aria-pressed', String(option === button)));
      if (demo.dataset.stage === 'saved') {
        noteStatus.textContent = `Saved to ${destination}`;
        announcement.textContent = `Example destination changed to ${destination}. Your note includes the transcript and original audio.`;
      }
    });
  });

  // A tab switch or a motion preference change should never strand the example.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && demo.dataset.stage !== 'saved') finish();
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches && demo.dataset.stage !== 'saved') finish();
  });
  document.querySelector('.demo-controls').hidden = false;
})();
