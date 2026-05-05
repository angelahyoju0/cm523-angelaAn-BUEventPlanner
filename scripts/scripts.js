// ─────────────────────────────────────────
//  BU Event Planner — scripts.js
// ─────────────────────────────────────────

// ── STATE ──────────────────────────────
const S = { date: null, catering: null, exemption: null, purchases: null };
const answered = new Set();
let totalT = 0, doneT = 0;
let inputEl = null;

// Event detail state (filled in by the 5-weeks form)
const EV = { name: '', purpose: '', attendance: null, venue: '' };

// ── BU VENUE DATA ──────────────────────
// types: 'social' | 'speaker' | 'music'
const BU_VENUES = [
  { name: 'GSU Metcalf Hall', location: '775 Commonwealth Ave, 2nd floor', capacity: 500,
    types: ['social','speaker','music'],
    notes: 'Largest flexible event space on campus. Divisible into sections. Full AV and staging available.',
    booking: 'gsubooking@bu.edu',
    url: 'https://www.bu.edu/classrooms/classroom/gsu-219b/' },
  { name: 'Tsai Performance Center', location: '685 Commonwealth Ave', capacity: 450,
    types: ['music','speaker'],
    notes: 'Professional tiered theater with full stage, fly system, and lighting grid. Best for ticketed performances.',
    booking: 'tsai@bu.edu',
    url: 'https://www.bu.edu/classrooms/classroom/tsai/' },
  { name: 'Morse Auditorium', location: '602 Commonwealth Ave', capacity: 260,
    types: ['speaker','music','social'],
    notes: 'Intimate auditorium with fixed seating and built-in AV. Good for panels, lectures, and smaller performances.',
    booking: 'SLIC',
    url: 'https://www.bu.edu/classrooms/classroom/mor-101/' },
  { name: 'GSU Ziskind Lounge', location: '775 Commonwealth Ave, 1st floor', capacity: 200,
    types: ['social','speaker'],
    notes: 'Warm, flexible lounge space. Great for mixers, receptions, and casual speaker events.',
    booking: 'gsubooking@bu.edu',
    url: 'https://www.bu.edu/classrooms/classroom/gsu-240/' },
  { name: 'FitRec Gymnasium', location: '915 Commonwealth Ave', capacity: 800,
    types: ['social','music'],
    notes: 'Large open floor ideal for high-attendance fairs, cultural showcases, and concerts. Requires extra setup.',
    booking: 'fitrec@bu.edu',
    url: 'https://www.bu.edu/fitrec/' },
  { name: 'CAS 224 (Lecture Hall)', location: '725 Commonwealth Ave', capacity: 170,
    types: ['speaker'],
    notes: 'Classic tiered lecture hall with built-in podium and projector. Best for academic or speaker-format events.',
    booking: 'SLIC',
    url: 'https://www.bu.edu/classrooms/classroom/cas-224/' },
  { name: 'Photonics Center Colloquium Room', location: "8 St. Mary's St, 9th floor", capacity: 120,
    types: ['speaker'],
    notes: 'Modern seminar room with panoramic views. Ideal for panels, talks, and professional networking.',
    booking: 'SLIC',
    url: 'https://www.bu.edu/classrooms/classroom/pho-906/' },
  { name: 'SMG Auditorium (Room 208)', location: '595 Commonwealth Ave', capacity: 340,
    types: ['speaker','social'],
    notes: 'Business school auditorium with fixed seating and full AV. Well-suited for professional or conference-style events.',
    booking: 'SLIC',
    url: 'https://www.bu.edu/classrooms/classroom/har-208/' },
  { name: 'GSU Alley', location: '775 Commonwealth Ave, ground floor', capacity: 150,
    types: ['social','music'],
    notes: 'High-traffic open area for tabling, casual events, and cultural performances. Catering exempt location.',
    booking: 'gsubooking@bu.edu',
    url: 'https://www.bu.edu/classrooms/classroom/gsu-b03a/' },
  { name: 'Sargent College Gymnasium', location: '635 Commonwealth Ave', capacity: 300,
    types: ['social','music'],
    notes: 'Open gymnasium floor good for large social events, showcases, and dances.',
    booking: 'SLIC',
    url: 'https://www.bu.edu/classrooms/classroom/sac-gym/' },
  { name: 'Kenmore Classroom Building 101', location: '47 Cummington Mall', capacity: 90,
    types: ['speaker','social'],
    notes: 'Smaller classroom-style space — best for workshops, discussion panels, or org meetings.',
    booking: 'SLIC',
    url: 'https://www.bu.edu/classrooms/classroom/kcb-101/' }
];

// ── QUESTION DEFINITIONS ───────────────
const QS = [
  {
    id: 'date',
    type: 'date',
    text: "When will your event take place?",
  },
  {
    id: 'catering',
    type: 'choice',
    text: "Will your event include food or catering?",
    opts: [
      { label: "Yes", val: true  },
      { label: 'No',  val: false }
    ]
  },
  {
    id: 'exemption',
    type: 'choice',
    cond: () => S.catering === true,
    text: "Will you be using a vendor outside of BU Catering on the Charles?",
    note: "If so, you'll need to go through the Catering Exemption process.",
    opts: [
      { label: 'Yes', val: true  },
      { label: 'Yes, but the event will take place in an exempt location (GSU alley or BU Central)', val: true  },
      { label: "No, I'll be using BU Catering", val: false }
    ]
  },
  {
    id: 'purchases',
    type: 'choice',
    text: "Will your org need to make any non-food purchases? (supplies, printing, décor, merchandise, etc.)",
    opts: [
      { label: 'Yes, we have purchases to make', val: true  },
      { label: 'No purchases needed',            val: false }
    ]
  }
];

// Returns the next unanswered question, skipping ones whose condition fails
function nextQ() {
  const order = ['date', 'catering', 'exemption', 'purchases'];
  for (const id of order) {
    if (answered.has(id)) continue;
    const q = QS.find(x => x.id === id);
    if (!q) continue;
    if (q.cond && !q.cond()) { answered.add(id); continue; }
    return q;
  }
  return null; // all questions answered
}

// ── PAGE NAVIGATION ───────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

function startPlanning() {
  showPage('chatPage');
  init();
}

// ── DOM HELPERS ────────────────────────
const stack = document.getElementById('chatStack');

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Escape HTML special characters to prevent XSS in dynamic content
function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function appendEl(el) {
  stack.appendChild(el);
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

function addTyping() {
  const r = document.createElement('div');
  r.className = 'typing-row fi';
  r.innerHTML = `
    <div class="avatar av-bot">🐾</div>
    <div class="typing-bub">
      <div class="td"></div>
      <div class="td"></div>
      <div class="td"></div>
    </div>`;
  appendEl(r);
  return r;
}

function removeEl(el) {
  if (el?.parentNode) el.parentNode.removeChild(el);
}

function addBot(text, note) {
  const r = document.createElement('div');
  r.className = 'row fi';
  r.innerHTML = `
    <div class="avatar av-bot">🐾</div>
    <div class="bubble b-bot">
      ${esc(text)}
      ${note ? `<div class="bubble-note">ℹ️ ${esc(note)}</div>` : ''}
    </div>`;
  appendEl(r);
}

function addUser(text) {
  const r = document.createElement('div');
  r.className = 'row user fi';
  r.innerHTML = `
    <div class="avatar av-user">You</div>
    <div class="bubble b-user">${esc(text)}</div>`;
  appendEl(r);
}

function clearInput() {
  if (inputEl) { removeEl(inputEl); inputEl = null; }
}

// ── CHAT FLOW ──────────────────────────
async function init() {
  const t = addTyping();
  await wait(900);
  removeEl(t);
  addBot("Hi, BU student leader! Answer a few questions about your event to generate a personalized, week-by-week checklist.");
  await wait(500);
  proceed();
}

async function proceed() {
  const q = nextQ();
  if (!q) { await buildPlan(); return; }

  const t = addTyping();
  await wait(1000);
  removeEl(t);
  addBot(q.text, q.note);
  await wait(200);

  if (q.type === 'date') showDateInput(q.id);
  else showChoices(q.id, q.opts);
}

function showDateInput(id) {
  clearInput();
  const today = new Date();
  const min = new Date(today.setDate(today.getDate() + 1)).toISOString().split('T')[0];
  const w = document.createElement('div');
  w.className = 'input-row fi';
  w.innerHTML = `
    <input type="date" class="date-inp" id="dInp" min="${min}">
    <button class="go-btn" onclick="submitDate('${id}')">Set Date →</button>
    <button class="skip-btn" onclick="skipDate('${id}')">Skip</button>`;
  appendEl(w);
  inputEl = w;
}

function showChoices(id, opts) {
  clearInput();
  const w = document.createElement('div');
  w.className = 'input-row fi';
  opts.forEach(o => {
    const b = document.createElement('button');
    b.className = 'ch-btn';
    b.textContent = o.label;
    b.onclick = () => pick(id, o, w);
    w.appendChild(b);
  });
  appendEl(w);
  inputEl = w;
}

async function pick(id, opt, wrap) {
  wrap.querySelectorAll('button').forEach(b => b.disabled = true);
  S[id] = opt.val;
  answered.add(id);
  clearInput();
  addUser(opt.label);
  await wait(350);
  proceed();
}

function submitDate(id) {
  const inp = document.getElementById('dInp');
  if (!inp.value) { inp.focus(); inp.style.borderColor = 'var(--scarlet)'; return; }
  const d = new Date(inp.value + 'T12:00:00'); // for timezone-shift issues
  S[id] = d;
  answered.add(id);
  clearInput();
  const label = d.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
  addUser(label);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((d - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 14) {
    wait(350)
      .then(() => addBot('⚠️ Heads up — BU requires all events to be submitted for approval at least two weeks in advance. Your selected date may not leave enough time, and some steps on your checklist may already be overdue.'))
      .then(() => wait(900))
      .then(proceed);
  } else {
    wait(350).then(proceed);
  }
}

function skipDate(id) {
  S[id] = null;
  answered.add(id);
  clearInput();
  addUser("I'll skip — just show me relative dates");
  wait(350).then(proceed);
}

// ── PLAN GENERATION ────────────────────
async function buildPlan() {
  const t = addTyping();
  await wait(1300);
  removeEl(t);
  addBot("Perfect! Your personalized event plan is ready.");
  await wait(1400);

  renderTimeline();
  saveStateToURL();
  showPage('checklistPage');
}

// Returns a formatted date string N days before the event, or null if no date set
function daysAgo(base, days) {
  if (!base) return null;
  const d = new Date(base);
  d.setDate(d.getDate() - days);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function renderTimeline() {
  const { date, catering, exemption, purchases } = S;
  const D = (n) => daysAgo(date, n);

  const weeks = [];

  // 5 Weeks Before — always present
  weeks.push({
    label: '5 Weeks Before', date: D(35), urg: 'low',
    tasks: [
      { title: 'Plan the details of your event',
        note: 'Finalize the event name, purpose, expected attendance, and preferred venue options.',
        tags: ['event'] }
    ]
  });

  // 4.5 Weeks Before — space reservation always; budget/approval if spending money
  const w45 = [
    { title: 'Fill out the Room Reservation form',
      note: '25Live is a scheduling software utilized by a number of departments across BU campus to assist in event, space, and resource management.',
      link: { url: 'https://www.bu.edu/reg/faculty-staff/25live/#:~:text=What%20is%2025Live%3F-,25Live,-is%20a%20vended', text: 'Click here to submit your Room Booking request on 25Live' },
      tags: ['event'] }
  ];
  if (purchases || catering) {
    w45.push({
      title: 'Budget out all purchases',
      note: 'Create an itemized estimate covering every anticipated event expense.',
      tags: ['purchase']
    });
    w45.push({
      title: 'Confirm fund usage with treasurer',
      note: "Gain approval from your organization's treasurer before committing to any costs.",
      tags: ['purchase']
    });
  }
  weeks.push({ label: '4.5 Weeks Before', date: D(31), urg: 'low', tasks: w45 });

  // 4 Weeks Before — catering only
  if (catering) {
    const w4 = [
      { title: 'Obtain an itemized invoice - before tax',
        note: 'Contact your catering vendor and request a detailed, tax-exempt invoice with all line items.',
        tags: ['catering'] }
    ];
    if (exemption) {
      w4.push({
        title: 'Email catering@bu.edu for a Catering Exemption',
        note: "Attach the itemized invoice and include a written explanation of your event and why you're using an outside vendor. Screenshots of the email thread with Catering must be uploaded to the Engage form for events.",
        tags: ['catering']
      });
    }
    weeks.push({ label: '4 Weeks Before', date: D(28), urg: 'medium', tasks: w4 });
  }

  // 3 Weeks Before — always present
  weeks.push({
    label: '3 Weeks Before', date: D(21), urg: 'medium',
    tasks: [
      { title: 'Submit the Event Request form',
        note: 'Submit through Terrier Central. Fill in all event details accurately to avoid delays.',
        link: { url: 'https://bu.campuslabs.com/engage/', text: 'Click here to submit your Event Request on Terrier Central'},
        tags: ['event'] }
    ]
  });

  // 2.5 Weeks Before — if any purchases or catering involved
  if (purchases || catering) {
    weeks.push({
      label: '2.5 Weeks Before', date: D(17), urg: 'high',
      tasks: [
        { title: 'Submit the Purchase Request form',
          note: purchases
            ? "Submit through Terrier Central. The event request must be approved by SLIC before this step."
            : "Submit through Terrier Central for your catering invoice.",
      link: { url: 'https://bu.campuslabs.com/engage/', text: 'Click here to submit your Purchase Request on Terrier Central'},
      tags: ['purchase'] }
      ]
    });
  }

  // 2 Weeks Before — always present; purchase confirmation if applicable
  const w2 = [];
  w2.push({
    title: 'Submit the Graphics Request form',
    note: 'Send your promotional materials request so your communications team has time to design and advertise your event.',
    tags: ['comms']
  });
  weeks.push({ label: '2 Weeks Before', date: D(14), urg: 'high', tasks: w2 });

  // 1 Week Before — always present
  weeks.push({
    label: '1 Week Before', date: D(7), urg: 'critical',
    tasks: [
      { title: 'Confirm your Event Request Approval',
        note: 'Follow up with SLIC to make sure your event request is officially approved and confirmed.',
        tags: ['event'] },
      { title: 'Confirm your Purchase Request Approval',
        note: 'Follow up with SLIC to make sure your purchase request is officially approved and confirmed.',
        tags: ['purchase'] },
      { title: 'Post graphics and advertise your event',
        note: "Advertise your event on social media, your org's channels, and any BU event listing boards.",
        tags: ['comms'] }
    ]
  });

  // Update counters
  totalT = weeks.reduce((s, w) => s + w.tasks.length, 0);
  doneT = 0;
  document.getElementById('totN').textContent = totalT;
  document.getElementById('doneN').textContent = 0;
  document.getElementById('progPct').textContent = '0%';

  // Update heading
  if (date) {
    const ds = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    document.getElementById('tlHeading').textContent = `Your Plan for ${ds}`;
  }
  document.getElementById('tlSub').textContent =
    `${totalT} tasks across ${weeks.length} checkpoints — check off as you go`;

  // Render cards with staggered reveal
  const container = document.getElementById('tlCards');
  container.innerHTML = '';

  weeks.forEach((wk, wi) => {
    const card = document.createElement('div');
    card.className = `wk-card urg-${wk.urg}`;
    card.dataset.wi = wi;

    const taskHtml = wk.tasks.map((t, ti) => `
      <div class="task" data-wi="${wi}" data-ti="${ti}" onclick="toggleTask(this)">
        <div class="task-cb">
          <svg class="ck-icon" width="12" height="9" viewBox="0 0 12 9" fill="none">
            <path d="M1 4.5L4 7.5L11 1" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="task-body">
          <div class="task-title">${esc(t.title)}</div>
          <div class="task-note">${esc(t.note)}${t.link ? ` <a class="task-note-link" href="${t.link.url}" target="_blank" rel="noopener noreferrer">${esc(t.link.text)}</a>` : ''}</div>
          <div class="task-tags">${t.tags.map(tg => `<span class="tag tag-${tg}">${tg}</span>`).join('')}</div>
        </div>
      </div>`).join('');

    // For week 0 (5 Weeks Before), inject the event detail form after the task list
    const extraHtml = (wi === 0) ? `
      <div class="ev-detail-form">
        <div class="ev-detail-label">Fill in your event details</div>
        <div class="ev-detail-grid">
          <div class="ev-field ev-field-wide">
            <label for="evName">Event Name</label>
            <input class="ev-input" type="text" id="evName" placeholder="e.g. Spring Cultural Night" oninput="EV.name=this.value">
          </div>
          <div class="ev-field">
            <label for="evPurpose">Event Type</label>
            <select class="ev-input ev-select" id="evPurpose" onchange="EV.purpose=this.value">
              <option value="">Select a type...</option>
              <option value="social">Social</option>
              <option value="speaker">Speaker / Panel</option>
              <option value="music">Music / Dance Performance</option>
            </select>
          </div>
          <div class="ev-field">
            <label for="evAttendance">Expected Attendance</label>
            <input class="ev-input" type="number" id="evAttendance" placeholder="e.g. 150" min="1" oninput="EV.attendance=parseInt(this.value)||null">
          </div>
          <div class="ev-field ev-field-wide">
            <label for="evVenue">Preferred Venue (if you have one)</label>
            <input class="ev-input" type="text" id="evVenue" placeholder="e.g. GSU Metcalf Hall" oninput="EV.venue=this.value">
          </div>
        </div>
      </div>

      <div class="venue-rec-wrap">
        <div class="venue-rec-prompt">
          <span class="venue-rec-icon">📍</span>
          <span>Unsure about which venue? Get top recommendations for your event.</span>
          <button class="venue-rec-btn" onclick="getVenueRecs()">Show Recommendations</button>
        </div>
        <div class="venue-rec-results" id="venueResults"></div>
      </div>` : '';

    card.innerHTML = `
      <div class="card-top">
        <span class="card-wk">${esc(wk.label)}</span>
        <div class="card-right">
          ${wk.date ? `<span class="card-date">${wk.date}</span>` : ''}
          <span class="card-done-pill">✓ Done</span>
        </div>
      </div>
      <div class="card-tasks">${taskHtml}</div>
      ${extraHtml}`;

    container.appendChild(card);
    setTimeout(() => card.classList.add('show'), 80 + wi * 110);
  });
}

// ── VENUE RECOMMENDATIONS ──────────────
function getVenueRecs() {
  const resultsEl = document.getElementById('venueResults');
  const { purpose, attendance } = EV;

  // Validation
  if (!purpose && !attendance) {
    resultsEl.innerHTML = `<div class="venue-rec-empty">Please select an event type and enter expected attendance first.</div>`;
    return;
  }
  if (!purpose) {
    resultsEl.innerHTML = `<div class="venue-rec-empty">Please select an event type to get recommendations.</div>`;
    return;
  }
  if (!attendance) {
    resultsEl.innerHTML = `<div class="venue-rec-empty">Please enter your expected attendance to get recommendations.</div>`;
    return;
  }

  // Map UI value to type key
  const typeMap = { social: 'social', speaker: 'speaker', music: 'music' };
  const typeKey = typeMap[purpose];

  // Filter: must match purpose type AND fit the attendance
  const filtered = BU_VENUES
    .filter(v => v.types.includes(typeKey) && v.capacity >= attendance)
    .sort((a, b) => (a.capacity - attendance) - (b.capacity - attendance))
    .slice(0, 5);

  const purposeLabel = { social: 'social', speaker: 'speaker/panel', music: 'music/dance performance' }[purpose];

  if (filtered.length === 0) {
    resultsEl.innerHTML = `<div class="venue-rec-empty">No BU venues in our list fit ${attendance} attendees for a ${purposeLabel} event. Consider reaching out to SLIC directly for large or unusual spaces.</div>`;
    return;
  }

  resultsEl.innerHTML = `
    <div class="venue-rec-header">
      Top ${filtered.length} recommended spaces for a <strong>${purposeLabel}</strong> event with <strong>${attendance}</strong> attendees
    </div>
    ${filtered.map((v, i) => `
      <div class="venue-card">
        <div class="venue-card-top">
          <div class="venue-rank">${i + 1}</div>
          <div class="venue-info">
            <div class="venue-name">${v.url ? `<a href="${v.url}" target="_blank" rel="noopener noreferrer">${esc(v.name)}</a>` : esc(v.name)}</div>
            <div class="venue-location">📍 ${esc(v.location)}</div>
          </div>
          <div class="venue-cap-badge">${v.capacity} cap.</div>
        </div>
        <div class="venue-notes">${esc(v.notes)}</div>
        <div class="venue-booking">Booking contact: <span>${esc(v.booking)}</span></div>
      </div>`).join('')}`;
}

// ── INTERACTIONS ───────────────────────
function toggleTask(el) {
  el.classList.toggle('checked');
  const justChecked = el.classList.contains('checked');
  if (justChecked) doneT++; else doneT--;

  document.getElementById('doneN').textContent = doneT;
  const pct = totalT ? Math.round(doneT / totalT * 100) : 0;
  document.getElementById('progFill').style.width = pct + '%';
  document.getElementById('progPct').textContent = pct + '%';

  // Mark card as fully complete if all its tasks are checked
  const wi = el.dataset.wi;
  const card = document.querySelector(`.wk-card[data-wi="${wi}"]`);
  if (card) {
    const allDone = [...card.querySelectorAll('.task')].every(t => t.classList.contains('checked'));
    card.classList.toggle('all-checked', allDone);
  }

  saveStateToURL();

  if (doneT === totalT && totalT > 0) {
    showPage('congratsPage');
    launchConfetti();
  } else if (document.getElementById('congratsPage').classList.contains('active')) {
    showPage('checklistPage');
  }
}

// ── CONFETTI ───────────────────────────
function launchConfetti() {
  const container = document.getElementById('confettiContainer');
  container.innerHTML = '';
  const colors = ['#7A9E7E','#C9A451','#C4999A','#6B9FD4','#DDD5CC','#F5EDE0','#ffffff'];

  for (let i = 0; i < 90; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const size = 5 + Math.random() * 8;
    piece.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${size}px;
      height: ${size}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${Math.random() > 0.4 ? '50%' : '2px'};
      animation-delay: ${Math.random() * 0.7}s;
      animation-duration: ${1.8 + Math.random() * 1.4}s;
    `;
    container.appendChild(piece);
  }

  // Clean up after animation finishes
  setTimeout(() => { container.innerHTML = ''; }, 4000);
}

// ── STAR RATING ────────────────────────
let currentRating = 0;

function setRating(val) {
  currentRating = val;
  document.getElementById('evalRating').value = val;
  document.querySelectorAll('.star').forEach(s => {
    s.classList.toggle('lit', parseInt(s.dataset.val) <= val);
  });
}

// Hover preview
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('mouseenter', () => {
      const hoverVal = parseInt(star.dataset.val);
      document.querySelectorAll('.star').forEach(s => {
        s.classList.toggle('lit', parseInt(s.dataset.val) <= hoverVal);
      });
    });
    star.addEventListener('mouseleave', () => {
      document.querySelectorAll('.star').forEach(s => {
        s.classList.toggle('lit', parseInt(s.dataset.val) <= currentRating);
      });
    });
  });
});

// ── EVALUATION ─────────────────────────
function showEval() {
  if (S.date) {
    const iso = S.date.toISOString().split('T')[0];
    document.getElementById('evalDateHeld').value = iso;
  }
  showPage('evalPage');
}

// ── PRINT ──────────────────────────────
function printChecklist() {
  document.body.classList.add('printing-checklist');
  window.print();
  setTimeout(() => document.body.classList.remove('printing-checklist'), 800);
}

function printEval() {
  document.body.classList.add('printing-eval');
  window.print();
  setTimeout(() => document.body.classList.remove('printing-eval'), 800);
}

function restart() {
  const url = new URL(window.location.href);
  url.searchParams.delete('s');
  window.history.replaceState(null, '', url.toString());
  Object.assign(S, { date: null, catering: null, exemption: null, purchases: null });
  answered.clear();
  totalT = 0;
  doneT = 0;
  inputEl = null;
  currentRating = 0;
  document.getElementById('chatStack').innerHTML = '';
  document.getElementById('tlCards').innerHTML = '';
  ['evalName','evalDateHeld','evalExpected','evalActual','evalTickets',
   'evalBudget','evalWell','evalImprove','evalEngagement','evalNotes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('evalRating').value = '0';
  document.querySelectorAll('.star').forEach(s => s.classList.remove('lit'));
  showPage('heroPage');
}

// ── URL STATE ──────────────────────────
function saveStateToURL() {
  const checked = [];
  document.querySelectorAll('.task.checked').forEach(el => {
    checked.push(el.dataset.wi + '-' + el.dataset.ti);
  });
  const payload = {
    d: S.date ? S.date.toISOString().split('T')[0] : null,
    c: S.catering,
    e: S.exemption,
    p: S.purchases,
    t: checked
  };
  const url = new URL(window.location.href);
  url.searchParams.set('s', btoa(JSON.stringify(payload)));
  window.history.replaceState(null, '', url.toString());
}

function loadFromURL() {
  try {
    const encoded = new URLSearchParams(window.location.search).get('s');
    if (!encoded) return false;
    const payload = JSON.parse(atob(encoded));
    if (payload.d) S.date = new Date(payload.d + 'T12:00:00');
    S.catering  = payload.c;
    S.exemption = payload.e;
    S.purchases = payload.p;
    ['date', 'catering', 'exemption', 'purchases'].forEach(id => answered.add(id));
    return Array.isArray(payload.t) ? payload.t : [];
  } catch { return false; }
}

function copyProgressLink() {
  saveStateToURL();
  navigator.clipboard.writeText(window.location.href).then(() => {
    const btn = document.getElementById('copyLinkBtn');
    const orig = btn.innerHTML;
    btn.innerHTML = '✓ Link copied!';
    btn.style.opacity = '0.7';
    setTimeout(() => { btn.innerHTML = orig; btn.style.opacity = ''; }, 2200);
  });
}

// ── START ──────────────────────────────
(function startup() {
  const checkedKeys = loadFromURL();
  if (checkedKeys !== false) {
    renderTimeline();
    checkedKeys.forEach(key => {
      const [wi, ti] = key.split('-');
      const el = document.querySelector(`.task[data-wi="${wi}"][data-ti="${ti}"]`);
      if (!el) return;
      el.classList.add('checked');
      doneT++;
      const card = document.querySelector(`.wk-card[data-wi="${wi}"]`);
      if (card) {
        const allDone = [...card.querySelectorAll('.task')].every(t => t.classList.contains('checked'));
        card.classList.toggle('all-checked', allDone);
      }
    });
    document.getElementById('doneN').textContent = doneT;
    const pct = totalT ? Math.round(doneT / totalT * 100) : 0;
    document.getElementById('progFill').style.width = pct + '%';
    document.getElementById('progPct').textContent = pct + '%';
    showPage(doneT === totalT && totalT > 0 ? 'congratsPage' : 'checklistPage');
  } else {
    showPage('heroPage');
  }
})();