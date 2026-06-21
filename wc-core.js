/* wc-core.js — shared, dependency-free logic for the 2026 World Cup tools.
 * UMD: usable as a browser global (window.WC) and via Node `require` (tests).
 * Pure functions where possible so the critical logic is unit-testable. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.WC = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const VERSION = '0.0.2';

  /* ===================== source-of-truth data ===================== */
  const TEAMS = [
    {g:"A",teams:[{n:"Mexico",host:"MEX"},{n:"South Korea"},{n:"Czechia"},{n:"South Africa"}]},
    {g:"B",teams:[{n:"Canada",host:"CAN"},{n:"Switzerland"},{n:"Bosnia & Herz."},{n:"Qatar"}]},
    {g:"C",teams:[{n:"Brazil"},{n:"Morocco"},{n:"Scotland"},{n:"Haiti"}]},
    {g:"D",teams:[{n:"United States",host:"USA"},{n:"Australia"},{n:"Paraguay"},{n:"Türkiye"}]},
    {g:"E",teams:[{n:"Germany"},{n:"Ivory Coast"},{n:"Ecuador"},{n:"Curaçao"}]},
    {g:"F",teams:[{n:"Sweden"},{n:"Japan"},{n:"Netherlands"},{n:"Tunisia"}]},
    {g:"G",teams:[{n:"New Zealand"},{n:"Iran"},{n:"Egypt"},{n:"Belgium"}]},
    {g:"H",teams:[{n:"Saudi Arabia"},{n:"Uruguay"},{n:"Spain"},{n:"Cape Verde"}]},
    {g:"I",teams:[{n:"Norway"},{n:"France"},{n:"Senegal"},{n:"Iraq"}]},
    {g:"J",teams:[{n:"Argentina"},{n:"Austria"},{n:"Jordan"},{n:"Algeria"}]},
    {g:"K",teams:[{n:"Colombia"},{n:"DR Congo"},{n:"Portugal"},{n:"Uzbekistan"}]},
    {g:"L",teams:[{n:"England"},{n:"Ghana"},{n:"Panama"},{n:"Croatia"}]},
  ];
  // each event: d=date(ISO), g=group, h=home, a=away, hs=home score, as=away score
  const EVENTS = [
    {d:"2026-06-11",g:"A",h:"Mexico",a:"South Africa",hs:2,as:0},
    {d:"2026-06-11",g:"A",h:"South Korea",a:"Czechia",hs:2,as:1},
    {d:"2026-06-12",g:"B",h:"Canada",a:"Bosnia & Herz.",hs:1,as:1},
    {d:"2026-06-12",g:"D",h:"United States",a:"Paraguay",hs:4,as:1},
    {d:"2026-06-13",g:"B",h:"Qatar",a:"Switzerland",hs:1,as:1},
    {d:"2026-06-13",g:"C",h:"Brazil",a:"Morocco",hs:1,as:1},
    {d:"2026-06-13",g:"C",h:"Haiti",a:"Scotland",hs:0,as:1},
    {d:"2026-06-13",g:"D",h:"Australia",a:"Türkiye",hs:2,as:0},
    {d:"2026-06-14",g:"E",h:"Germany",a:"Curaçao",hs:7,as:1},
    {d:"2026-06-14",g:"E",h:"Ivory Coast",a:"Ecuador",hs:1,as:0},
    {d:"2026-06-14",g:"F",h:"Netherlands",a:"Japan",hs:2,as:2},
    {d:"2026-06-14",g:"F",h:"Sweden",a:"Tunisia",hs:5,as:1},
    {d:"2026-06-15",g:"G",h:"Belgium",a:"Egypt",hs:1,as:1},
    {d:"2026-06-15",g:"G",h:"Iran",a:"New Zealand",hs:2,as:2},
    {d:"2026-06-15",g:"H",h:"Spain",a:"Cape Verde",hs:0,as:0},
    {d:"2026-06-15",g:"H",h:"Saudi Arabia",a:"Uruguay",hs:1,as:1},
    {d:"2026-06-16",g:"I",h:"France",a:"Senegal",hs:3,as:1},
    {d:"2026-06-16",g:"I",h:"Iraq",a:"Norway",hs:1,as:4},
    {d:"2026-06-16",g:"J",h:"Argentina",a:"Algeria",hs:3,as:0},
    {d:"2026-06-16",g:"J",h:"Austria",a:"Jordan",hs:3,as:1},
    {d:"2026-06-17",g:"K",h:"Portugal",a:"DR Congo",hs:1,as:1},
    {d:"2026-06-17",g:"K",h:"Uzbekistan",a:"Colombia",hs:1,as:3},
    {d:"2026-06-17",g:"L",h:"England",a:"Croatia",hs:4,as:2},
    {d:"2026-06-17",g:"L",h:"Ghana",a:"Panama",hs:1,as:0},
    {d:"2026-06-18",g:"A",h:"Czechia",a:"South Africa",hs:1,as:1},
    {d:"2026-06-18",g:"A",h:"Mexico",a:"South Korea",hs:1,as:0},
    {d:"2026-06-18",g:"B",h:"Switzerland",a:"Bosnia & Herz.",hs:4,as:1},
    {d:"2026-06-18",g:"B",h:"Canada",a:"Qatar",hs:6,as:0},
    {d:"2026-06-19",g:"C",h:"Scotland",a:"Morocco",hs:0,as:1},
    {d:"2026-06-19",g:"C",h:"Brazil",a:"Haiti",hs:3,as:0},
    {d:"2026-06-19",g:"D",h:"United States",a:"Australia",hs:2,as:0},
    {d:"2026-06-19",g:"D",h:"Türkiye",a:"Paraguay",hs:0,as:1},
    {d:"2026-06-20",g:"E",h:"Germany",a:"Ivory Coast",hs:2,as:1},
    {d:"2026-06-20",g:"E",h:"Ecuador",a:"Curaçao",hs:0,as:0},
    {d:"2026-06-20",g:"F",h:"Netherlands",a:"Sweden",hs:5,as:1},
    {d:"2026-06-20",g:"F",h:"Tunisia",a:"Japan",hs:0,as:4},
  ];
  // every group-stage match day (day granularity is enough for the update guard)
  const SCHEDULE_DATES = [
    "2026-06-11","2026-06-12","2026-06-13","2026-06-14","2026-06-15","2026-06-16",
    "2026-06-17","2026-06-18","2026-06-19","2026-06-20","2026-06-21","2026-06-22",
    "2026-06-23","2026-06-24","2026-06-25","2026-06-26","2026-06-27",
  ];
  // scheduled group-stage fixtures not yet played (no scores) — drive date-unlocking + "upcoming" display.
  // NEVER fed to buildState (scoreless), so they don't affect standings.
  const FIXTURES = [
    {d:"2026-06-21",g:"G",h:"Belgium",a:"Iran"},
    {d:"2026-06-21",g:"G",h:"New Zealand",a:"Egypt"},
    {d:"2026-06-21",g:"H",h:"Uruguay",a:"Cape Verde"},
    {d:"2026-06-21",g:"H",h:"Spain",a:"Saudi Arabia"},
    {d:"2026-06-22",g:"I",h:"France",a:"Iraq"},
    {d:"2026-06-22",g:"I",h:"Norway",a:"Senegal"},
    {d:"2026-06-22",g:"J",h:"Argentina",a:"Austria"},
    {d:"2026-06-22",g:"J",h:"Jordan",a:"Algeria"},
    {d:"2026-06-23",g:"K",h:"Portugal",a:"Uzbekistan"},
    {d:"2026-06-23",g:"K",h:"Colombia",a:"DR Congo"},
    {d:"2026-06-23",g:"L",h:"England",a:"Ghana"},
    {d:"2026-06-23",g:"L",h:"Panama",a:"Croatia"},
    {d:"2026-06-24",g:"A",h:"Czechia",a:"Mexico"},
    {d:"2026-06-24",g:"A",h:"South Africa",a:"South Korea"},
    {d:"2026-06-24",g:"B",h:"Switzerland",a:"Canada"},
    {d:"2026-06-24",g:"B",h:"Bosnia & Herz.",a:"Qatar"},
    {d:"2026-06-24",g:"C",h:"Scotland",a:"Brazil"},
    {d:"2026-06-24",g:"C",h:"Morocco",a:"Haiti"},
    {d:"2026-06-25",g:"D",h:"Türkiye",a:"United States"},
    {d:"2026-06-25",g:"D",h:"Paraguay",a:"Australia"},
    {d:"2026-06-25",g:"E",h:"Curaçao",a:"Ivory Coast"},
    {d:"2026-06-25",g:"E",h:"Ecuador",a:"Germany"},
    {d:"2026-06-25",g:"F",h:"Japan",a:"Sweden"},
    {d:"2026-06-25",g:"F",h:"Tunisia",a:"Netherlands"},
    {d:"2026-06-26",g:"G",h:"Egypt",a:"Iran"},
    {d:"2026-06-26",g:"G",h:"New Zealand",a:"Belgium"},
    {d:"2026-06-26",g:"H",h:"Cape Verde",a:"Saudi Arabia"},
    {d:"2026-06-26",g:"H",h:"Uruguay",a:"Spain"},
    {d:"2026-06-26",g:"I",h:"Norway",a:"France"},
    {d:"2026-06-26",g:"I",h:"Senegal",a:"Iraq"},
    {d:"2026-06-27",g:"J",h:"Algeria",a:"Austria"},
    {d:"2026-06-27",g:"J",h:"Jordan",a:"Argentina"},
    {d:"2026-06-27",g:"K",h:"Colombia",a:"Portugal"},
    {d:"2026-06-27",g:"K",h:"DR Congo",a:"Uzbekistan"},
    {d:"2026-06-27",g:"L",h:"Panama",a:"England"},
    {d:"2026-06-27",g:"L",h:"Croatia",a:"Ghana"},
  ];

  /* ===================== misc ===================== */
  // escape for safe insertion into HTML text OR double/single-quoted attributes (XSS guard for
  // any string that originated from a remote API, localStorage, or user edits)
  const ESC = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ESC[c]);

  /* ===================== standings engine ===================== */
  const num = v => { v = Math.floor(Number(v)); return Number.isFinite(v) && v >= 0 ? v : 0; };
  const P   = t => (t.p != null ? num(t.p) : num(t.w) + num(t.d) + num(t.l));
  const GD  = t => num(t.gf) - num(t.ga);
  const PTS = t => 3 * num(t.w) + num(t.d);
  const fmtGD = v => (v > 0 ? '+' + v : '' + v);
  // FIFA primary ranking: points, then goal difference, then goals scored. (name = stable fallback)
  const cmp = (a, b) => PTS(b) - PTS(a) || GD(b) - GD(a) || num(b.gf) - num(a.gf) || String(a.n).localeCompare(String(b.n));
  const sortGroups = state => { state.forEach(grp => grp.teams.sort(cmp)); return state; };

  // cutoff: 'ZERO' = no games | 'ALL' = all events | ISO date = events on/before that date
  function buildState(cutoff, events, teams) {
    events = events || EVENTS;
    teams = teams || TEAMS;
    const st = teams.map(grp => ({ g: grp.g, teams: grp.teams.map((t, i) => ({ n: t.n, host: t.host, i, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 })) }));
    if (cutoff === 'ZERO') return st;
    const idx = {};
    st.forEach(grp => grp.teams.forEach(t => { idx[grp.g + '|' + t.n] = t; }));
    events.forEach(ev => {
      if (cutoff !== 'ALL' && cutoff && ev.d > cutoff) return;
      const h = idx[ev.g + '|' + ev.h], a = idx[ev.g + '|' + ev.a];
      if (!h || !a) return;
      const hs = num(ev.hs), as = num(ev.as);
      h.gf += hs; h.ga += as; a.gf += as; a.ga += hs; h.p++; a.p++;
      if (hs > as) { h.w++; a.l++; } else if (hs < as) { h.l++; a.w++; } else { h.d++; a.d++; }
    });
    return st;
  }

  /* ===================== 3rd-place qualification + bracket matching ===================== */
  const ELIG = [
    { m: 74, win: 'E', allow: ['A','B','C','D','F'] },
    { m: 77, win: 'I', allow: ['C','D','F','G','H'] },
    { m: 79, win: 'A', allow: ['C','E','F','H','I'] },
    { m: 80, win: 'L', allow: ['E','H','I','J','K'] },
    { m: 81, win: 'D', allow: ['B','E','F','I','J'] },
    { m: 82, win: 'G', allow: ['A','E','H','I','J'] },
    { m: 85, win: 'B', allow: ['E','F','G','I','J'] },
    { m: 87, win: 'K', allow: ['D','E','I','J','L'] },
  ];
  const matchWinnerGrp = { 74:'E',77:'I',79:'A',80:'L',81:'D',82:'G',85:'B',87:'K' };

  // rank the 12 third-placed teams together; mark the best 8
  function rankThirds(state) {
    const thirds = state.map(grp => Object.assign({ g: grp.g }, grp.teams[2]));
    thirds.sort(cmp);
    return thirds.map((t, i) => Object.assign({}, t, { rank: i + 1, qualified: i < 8 }));
  }

  // assign the qualifying groups' thirds to the 8 winner slots (bipartite perfect matching,
  // dynamic minimum-remaining-values backtracking). Returns {matchNo: groupLetter} or null.
  function assignThirds(qualGroups) {
    const qset = new Set(qualGroups);
    const used = new Set(), out = {};
    const slots = ELIG.map(s => ({ m: s.m, allow: s.allow }));
    function solve(remaining) {
      if (remaining.length === 0) return true;
      let bestIdx = -1, bestCands = null;
      for (let i = 0; i < remaining.length; i++) {
        const c = remaining[i].allow.filter(g => qset.has(g) && !used.has(g));
        if (bestCands === null || c.length < bestCands.length) { bestIdx = i; bestCands = c; }
      }
      if (bestCands.length === 0) return false;
      const slot = remaining[bestIdx];
      const rest = remaining.filter((_, i) => i !== bestIdx);
      for (const g of bestCands) {
        used.add(g); out[slot.m] = g;
        if (solve(rest)) return true;
        used.delete(g); delete out[slot.m];
      }
      return false;
    }
    return solve(slots) ? out : null;
  }

  /* ===================== shareable state encoding (compact, positional, versioned) ===================== */
  // state -> URL-safe string. Stats are positional by canonical team order, so names aren't sent unless renamed.
  // Typical link is a few hundred chars; self-contained (no dependence on the recipient's local data).
  function encodeState(state) {
    const order = grp => grp.teams.slice().sort((a, b) => ((a.i != null ? a.i : 0) - (b.i != null ? b.i : 0)));
    const nums = (state || []).map(grp =>
      order(grp).map(t => [num(t.p), num(t.w), num(t.d), num(t.l), num(t.gf), num(t.ga)].join('.')).join('-')
    ).join('_');
    const ov = [];
    (state || []).forEach((grp, gi) => {
      const base = TEAMS[gi]; if (!base) return;
      order(grp).forEach((t, i) => { const canon = base.teams[i] && base.teams[i].n; if (canon && t.n !== canon) ov.push([grp.g, i, String(t.n).slice(0, 40)]); });
    });
    return '1~' + nums + '~' + (ov.length ? encodeURIComponent(JSON.stringify(ov)) : '');
  }
  // URL-safe string -> state, rebuilt from the canonical base + decoded numbers. Returns null if malformed.
  function decodeState(payload) {
    try {
      const parts = String(payload).split('~');
      if (parts[0] !== '1') return null;
      const groups = parts[1].split('_');
      if (groups.length !== TEAMS.length) return null;
      const st = TEAMS.map((grp, gi) => {
        const cells = groups[gi].split('-');
        if (cells.length !== grp.teams.length) throw new Error('group shape');
        return { g: grp.g, teams: grp.teams.map((ct, i) => {
          const v = cells[i].split('.');
          if (v.length !== 6) throw new Error('team shape');
          return { n: ct.n, host: ct.host, i, p: num(v[0]), w: num(v[1]), d: num(v[2]), l: num(v[3]), gf: num(v[4]), ga: num(v[5]) };
        }) };
      });
      if (parts[2]) {
        const ov = JSON.parse(decodeURIComponent(parts[2]));
        if (Array.isArray(ov)) ov.forEach(o => {
          const gi = TEAMS.findIndex(x => x.g === o[0]), i = o[1];
          if (gi >= 0 && st[gi].teams[i] && typeof o[2] === 'string') st[gi].teams[i].n = o[2].slice(0, 40);
        });
      }
      return st;
    } catch (e) { return null; }
  }

  /* ===================== live-update helpers (pure / injectable) ===================== */
  // map external (ESPN) team names onto our canonical display names
  const NAME_ALIASES = {
    'Turkey':'Türkiye','Türkiye':'Türkiye',
    'Korea Republic':'South Korea','South Korea':'South Korea','Korea, Republic of':'South Korea',
    'Czech Republic':'Czechia','Czechia':'Czechia',
    "Côte d'Ivoire":'Ivory Coast','Ivory Coast':'Ivory Coast','Cote d\'Ivoire':'Ivory Coast',
    'Cabo Verde':'Cape Verde','Cape Verde':'Cape Verde',
    'Bosnia and Herzegovina':'Bosnia & Herz.','Bosnia-Herzegovina':'Bosnia & Herz.','Bosnia & Herz.':'Bosnia & Herz.',
    'Congo DR':'DR Congo','DR Congo':'DR Congo','Democratic Republic of the Congo':'DR Congo',
    'USA':'United States','United States':'United States','United States of America':'United States',
    'Curacao':'Curaçao','Curaçao':'Curaçao',
  };
  const CANON = (() => { const s = new Set(); TEAMS.forEach(grp => grp.teams.forEach(t => s.add(t.n))); return s; })();
  const TEAM_GROUP = (() => { const m = {}; TEAMS.forEach(grp => grp.teams.forEach(t => { m[t.n] = grp.g; })); return m; })();

  function normalizeTeam(name) {
    if (name == null) return null;
    const s = String(name).trim();
    if (CANON.has(s)) return s;
    if (NAME_ALIASES[s]) return NAME_ALIASES[s];
    return null; // unknown -> caller skips it
  }
  const teamGroup = name => TEAM_GROUP[name] || null;

  // ESPN scoreboard JSON -> our event objects (completed matches only). Defensive against shape drift.
  function parseScoreboard(json) {
    const out = [];
    const evs = (json && json.events) || [];
    for (const ev of evs) {
      const comp = ev && ev.competitions && ev.competitions[0];
      if (!comp) continue;
      const st = (comp.status && comp.status.type) || (ev.status && ev.status.type) || {};
      if (!st.completed) continue;
      const cs = comp.competitors || [];
      const home = cs.find(c => c.homeAway === 'home') || cs[0];
      const away = cs.find(c => c.homeAway === 'away') || cs[1];
      if (!home || !away) continue;
      const hn = normalizeTeam(home.team && home.team.displayName);
      const an = normalizeTeam(away.team && away.team.displayName);
      if (!hn || !an) continue;
      const g = teamGroup(hn);
      if (!g || teamGroup(an) !== g) continue; // both must be the same known group
      const hs = parseInt(home.score, 10), as = parseInt(away.score, 10);
      if (!Number.isFinite(hs) || !Number.isFinite(as)) continue;
      const d = String(ev.date || '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
      out.push({ d, g, h: hn, a: an, hs, as });
    }
    return out;
  }

  const eventKey = ev => ev.g + '|' + ev.d + '|' + [ev.h, ev.a].slice().sort().join('~');

  // merge incoming events into existing, returning a new array + whether anything changed
  function mergeEvents(existing, incoming) {
    const map = new Map((existing || []).map(e => [eventKey(e), e]));
    let changed = false, added = 0, updated = 0;
    for (const e of (incoming || [])) {
      const k = eventKey(e), prev = map.get(k);
      if (!prev) { map.set(k, e); added++; changed = true; }
      else if (prev.hs !== e.hs || prev.as !== e.as || prev.h !== e.h) { map.set(k, e); updated++; changed = true; }
    }
    const events = [...map.values()].sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : a.g < b.g ? -1 : a.g > b.g ? 1 : 0));
    return { events, changed, added, updated };
  }

  const isoToYmd = iso => String(iso).slice(0, 10).replace(/-/g, '');
  const latestDate = events => (events && events.length ? events.reduce((m, e) => (e.d > m ? e.d : m), events[0].d) : null);

  // every distinct match day across played results + scheduled fixtures
  const allMatchDates = (events, fixtures) => {
    const s = new Set();
    (events || EVENTS).forEach(e => s.add(e.d));
    (fixtures || FIXTURES).forEach(f => s.add(f.d));
    return [...s].sort();
  };
  // match days that have "arrived" per the authoritative clock (ms). With no server time, fall back to the
  // latest PLAYED date so the future is never revealed. As real time advances, more days unlock automatically.
  const unlockedDates = (serverNowMs, events, fixtures) => {
    const cutoff = (serverNowMs != null)
      ? new Date(serverNowMs).toISOString().slice(0, 10)
      : (latestDate(events || EVENTS) || '');
    return allMatchDates(events, fixtures).filter(d => d <= cutoff);
  };

  // decide whether a network fetch is worthwhile. Uses authoritative server time (ms), NOT local clock.
  function shouldFetch(opts) {
    const { serverNowMs, lastFetchMs, latestResultDate, scheduleDates, minIntervalMs } = opts || {};
    if (lastFetchMs != null && serverNowMs != null && (serverNowMs - lastFetchMs) < (minIntervalMs || 0))
      return { fetch: false, reason: 'throttled' };
    const dates = (scheduleDates || SCHEDULE_DATES).filter(d => d > (latestResultDate || ''));
    if (!dates.length) return { fetch: false, reason: 'no-more-matches' };
    const next = dates[0];
    if (serverNowMs != null) {
      const nextStart = Date.parse(next + 'T00:00:00Z');
      if (serverNowMs < nextStart) return { fetch: false, reason: 'no-new-games' };
    }
    return { fetch: true, reason: 'due', next };
  }

  // turn any thrown error into a tight headline + a copyable long-form technical string
  function formatError(err) {
    let short = 'Failed: update error';
    let long;
    if (err == null) long = 'Unknown error (no detail)';
    else if (typeof err === 'string') long = err;
    else long = (err.stack || (err.name ? err.name + ': ' : '') + (err.message || String(err)));
    const name = err && err.name, msg = (err && err.message) || (typeof err === 'string' ? err : '');
    const status = err && err.status;
    if (status) { short = 'Failed: HTTP ' + status; long = 'HTTP ' + status + (err.statusText ? ' ' + err.statusText : '') + (err.url ? '\n' + err.url : '') + (long ? '\n' + long : ''); }
    else if (name === 'AbortError') short = 'Failed: request timed out';
    else if (name === 'SyntaxError') short = 'Failed: bad response';
    else if (name === 'TypeError' || /fetch|network|load failed/i.test(msg)) short = 'Failed: network error';
    return { short, long: String(long) };
  }

  const nextBackoff = (attempt, base) => (base || 400) * Math.pow(2, attempt); // attempt: 0,1,2…

  // retry an async fn with exponential backoff. `sleep` injectable for tests.
  async function withRetry(fn, opts) {
    opts = opts || {};
    const retries = opts.retries != null ? opts.retries : 2;
    const base = opts.baseDelay || 400;
    const sleep = opts.sleep || (ms => new Promise(r => setTimeout(r, ms)));
    let last;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try { return await fn(attempt); }
      catch (e) { last = e; if (attempt < retries) await sleep(nextBackoff(attempt, base)); }
    }
    throw last;
  }

  /* ===================== network (browser; thin, injectable fetch) ===================== */
  const TIME_URL = 'https://worldtimeapi.org/api/timezone/Etc/UTC';
  const ESPN_URL = ymd => 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=' + ymd;

  async function httpJson(url, fetchFn, timeoutMs) {
    fetchFn = fetchFn || (typeof fetch !== 'undefined' ? fetch : null);
    if (!fetchFn) throw new Error('no fetch available');
    let ctrl, timer;
    const opt = { method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-store' };
    if (typeof AbortController !== 'undefined') { ctrl = new AbortController(); opt.signal = ctrl.signal; timer = setTimeout(() => ctrl.abort(), timeoutMs || 8000); }
    try {
      const res = await fetchFn(url, opt);
      if (!res.ok) { const e = new Error('HTTP ' + res.status); e.status = res.status; e.statusText = res.statusText; e.url = url; throw e; }
      return await res.json();
    } finally { if (timer) clearTimeout(timer); }
  }

  async function getServerTimeMs(fetchFn) {
    const j = await httpJson(TIME_URL, fetchFn, 6000);
    const ms = (j && j.unixtime) ? j.unixtime * 1000 : Date.parse(j && j.utc_datetime);
    if (!Number.isFinite(ms)) throw new Error('bad time response');
    return ms;
  }

  // fetch + parse results for a list of ISO dates; returns flattened event array
  async function fetchResults(dates, fetchFn) {
    const all = [];
    for (const d of dates) {
      const j = await httpJson(ESPN_URL(isoToYmd(d)), fetchFn, 8000);
      parseScoreboard(j).forEach(e => all.push(e));
    }
    return all;
  }

  return {
    VERSION, TEAMS, EVENTS, SCHEDULE_DATES, FIXTURES, esc,
    num, P, GD, PTS, fmtGD, cmp, sortGroups, buildState,
    ELIG, matchWinnerGrp, rankThirds, assignThirds,
    encodeState, decodeState,
    NAME_ALIASES, normalizeTeam, teamGroup, parseScoreboard, eventKey, mergeEvents,
    isoToYmd, latestDate, allMatchDates, unlockedDates, shouldFetch, formatError, nextBackoff, withRetry,
    TIME_URL, ESPN_URL, httpJson, getServerTimeMs, fetchResults,
  };
});
