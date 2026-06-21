'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const WC = require('../wc-core.js');

/* ---------------- standings engine ---------------- */
test('buildState ALL: A–F played 2, G–L played 1; goals balance per group', () => {
  const st = WC.buildState('ALL');
  const played2 = new Set(['A','B','C','D','E','F']);
  for (const grp of st) {
    let gf = 0, ga = 0;
    for (const t of grp.teams) { gf += t.gf; ga += t.ga; assert.equal(t.p, played2.has(grp.g) ? 2 : 1, `${grp.g} ${t.n} played`); }
    assert.equal(gf, ga, `group ${grp.g} goal balance`);
  }
});

test('buildState ALL: Mexico tops Group A on 6 pts', () => {
  const a = WC.sortGroups(WC.buildState('ALL'))[0];
  assert.equal(a.teams[0].n, 'Mexico');
  assert.equal(WC.PTS(a.teams[0]), 6);
  assert.equal(WC.GD(a.teams[0]), 3);
});

test('buildState ALL: Group D corrected (Paraguay 2-4, Türkiye 0-3)', () => {
  const d = WC.buildState('ALL').find(g => g.g === 'D').teams;
  const para = d.find(t => t.n === 'Paraguay');
  const tur = d.find(t => t.n === 'Türkiye');
  assert.deepEqual([para.gf, para.ga], [2, 4]);
  assert.deepEqual([tur.gf, tur.ga], [0, 3]);
});

test('buildState ZERO is all zeros; date cutoff after MD1 gives every team 1 game', () => {
  for (const grp of WC.buildState('ZERO')) for (const t of grp.teams) assert.equal(t.p + t.gf + t.ga, 0);
  for (const grp of WC.buildState('2026-06-17')) for (const t of grp.teams) assert.equal(t.p, 1);
  for (const grp of WC.buildState('2026-06-10')) for (const t of grp.teams) assert.equal(t.p, 0); // before kickoff
});

test('cmp ranks by points, then GD, then goals scored', () => {
  const mk = (n, w, d, l, gf, ga) => ({ n, w, d, l, gf, ga });
  const teams = [mk('Z',1,0,1,2,2), mk('Y',1,1,0,1,1), mk('X',1,1,0,5,1), mk('W',1,1,0,5,3)];
  const order = teams.slice().sort(WC.cmp).map(t => t.n);
  assert.deepEqual(order, ['X', 'W', 'Y', 'Z']); // X/W 4pts (X better GD), then Y 4pts? no: Y has GD0 -> after; Z 3pts last
});

/* ---------------- 3rd-place ranking + bracket matching ---------------- */
function assertValidAssignment(qualGroups, asg) {
  assert.ok(asg, 'a matching exists');
  const used = new Set();
  for (const s of WC.ELIG) {
    const g = asg[s.m];
    assert.ok(g, `slot ${s.m} filled`);
    assert.ok(s.allow.includes(g), `slot ${s.m} (win ${s.win}) accepts group ${g}`);
    assert.notEqual(g, s.win, `winner ${s.win} not vs its own group's 3rd`);
    assert.ok(!used.has(g), `group ${g} used once`);
    used.add(g);
  }
  assert.equal(used.size, 8);
  for (const g of qualGroups) assert.ok(used.has(g), `qualifier ${g} placed`);
}

test('assignThirds: current standings produce a valid one-to-one matching', () => {
  const ranked = WC.rankThirds(WC.sortGroups(WC.buildState('ALL')));
  const qual = ranked.filter(t => t.qualified).map(t => t.g);
  assert.equal(qual.length, 8);
  assertValidAssignment(qual, WC.assignThirds(qual));
});

test('assignThirds: a valid matching exists for many different qualifier sets', () => {
  const ALL = 'ABCDEFGHIJKL'.split('');
  const combos = [
    ['A','C','E','F','H','I','J','L'],
    ['A','B','C','D','E','F','G','H'],
    ['E','F','G','H','I','J','K','L'],
    ['A','B','C','D','I','J','K','L'],
    ['B','D','F','H','J','L','A','C'],
  ];
  for (const c of combos) assertValidAssignment(c, WC.assignThirds(c));
});

test('assignThirds: every C(12,8) subset admits a valid matching (full Annex-C coverage)', () => {
  const ALL = 'ABCDEFGHIJKL'.split('');
  let total = 0, ok = 0;
  // choose 8 of 12 == drop 4 of 12
  for (let a = 0; a < 12; a++) for (let b = a + 1; b < 12; b++) for (let c = b + 1; c < 12; c++) for (let d = c + 1; d < 12; d++) {
    const drop = new Set([a, b, c, d]);
    const qual = ALL.filter((_, k) => !drop.has(k));
    total++;
    if (WC.assignThirds(qual)) ok++;
  }
  assert.equal(total, 495);
  assert.equal(ok, 495); // FIFA's matrix guarantees a valid slotting for any combination
});

/* ---------------- shareable state encoding ---------------- */
test('encodeState/decodeState round-trips numbers + renames, URL-safe & compact', () => {
  const st = WC.sortGroups(WC.buildState('ALL'));
  const mex = st.find(g => g.g === 'A').teams.find(t => t.n === 'Mexico'); mex.w = 3; mex.gf = 9; mex.p = 3;
  st.find(g => g.g === 'C').teams[0].n = 'Brasil';   // a rename
  const payload = WC.encodeState(st);
  assert.ok(!/[#&=\s]/.test(payload.split('~')[1]), 'numbers section is URL-safe');
  assert.ok(payload.length < 1500, 'payload stays short (' + payload.length + ' chars)');
  const back = WC.decodeState(payload);
  const bMex = back.find(g => g.g === 'A').teams.find(t => t.i === mex.i);
  assert.deepEqual([bMex.w, bMex.gf, bMex.p], [3, 9, 3]);
  assert.equal(back.find(g => g.g === 'C').teams.find(t => t.i === 0).n, 'Brasil');
});
test('decodeState rejects malformed / wrong-version payloads', () => {
  assert.equal(WC.decodeState('nope'), null);
  assert.equal(WC.decodeState('2~x~'), null);          // bad version
  assert.equal(WC.decodeState('1~only.one.group~'), null);  // wrong group count
  assert.equal(WC.decodeState(''), null);
});

/* ---------------- live-update helpers ---------------- */
test('normalizeTeam maps aliases and rejects unknowns', () => {
  assert.equal(WC.normalizeTeam('Turkey'), 'Türkiye');
  assert.equal(WC.normalizeTeam('Korea Republic'), 'South Korea');
  assert.equal(WC.normalizeTeam('Cabo Verde'), 'Cape Verde');
  assert.equal(WC.normalizeTeam('Mexico'), 'Mexico');
  assert.equal(WC.normalizeTeam('Narnia'), null);
  assert.equal(WC.normalizeTeam(undefined), null);
});

test('parseScoreboard keeps only completed, known, same-group matches', () => {
  const json = { events: [
    { date: '2026-06-21T16:00Z', competitions: [{ status: { type: { completed: true } }, competitors: [
      { homeAway: 'home', score: '2', team: { displayName: 'Spain' } },
      { homeAway: 'away', score: '1', team: { displayName: 'Cabo Verde' } } ] }] },
    { date: '2026-06-21T19:00Z', competitions: [{ status: { type: { completed: false } }, competitors: [
      { homeAway: 'home', score: '0', team: { displayName: 'Uruguay' } },
      { homeAway: 'away', score: '0', team: { displayName: 'Saudi Arabia' } } ] }] },           // not completed
    { date: '2026-06-21T19:00Z', competitions: [{ status: { type: { completed: true } }, competitors: [
      { homeAway: 'home', score: '1', team: { displayName: 'Narnia' } },
      { homeAway: 'away', score: '2', team: { displayName: 'Spain' } } ] }] },                   // unknown team
    { date: '2026-06-21T19:00Z', competitions: [{ status: { type: { completed: true } }, competitors: [
      { homeAway: 'home', score: '3', team: { displayName: 'Spain' } },
      { homeAway: 'away', score: '0', team: { displayName: 'Germany' } } ] }] },                 // cross-group
  ] };
  const ev = WC.parseScoreboard(json);
  assert.equal(ev.length, 1);
  assert.deepEqual(ev[0], { d: '2026-06-21', g: 'H', h: 'Spain', a: 'Cape Verde', hs: 2, as: 1 });
});

test('parseScoreboard tolerates malformed input', () => {
  assert.deepEqual(WC.parseScoreboard(null), []);
  assert.deepEqual(WC.parseScoreboard({}), []);
  assert.deepEqual(WC.parseScoreboard({ events: [{}, { competitions: [] }] }), []);
});

test('mergeEvents detects adds, updates, and no-ops', () => {
  const base = [{ d: '2026-06-21', g: 'H', h: 'Spain', a: 'Cape Verde', hs: 2, as: 1 }];
  const same = WC.mergeEvents(base, [{ d: '2026-06-21', g: 'H', h: 'Spain', a: 'Cape Verde', hs: 2, as: 1 }]);
  assert.equal(same.changed, false);
  const add = WC.mergeEvents(base, [{ d: '2026-06-21', g: 'I', h: 'Norway', a: 'France', hs: 1, as: 1 }]);
  assert.equal(add.added, 1); assert.equal(add.changed, true); assert.equal(add.events.length, 2);
  const upd = WC.mergeEvents(base, [{ d: '2026-06-21', g: 'H', h: 'Spain', a: 'Cape Verde', hs: 3, as: 1 }]);
  assert.equal(upd.updated, 1); assert.equal(upd.changed, true); assert.equal(upd.events.length, 1);
});

test('unlockedDates: hides the future, reveals arrived days, safe fallback', () => {
  // with an authoritative clock of Jun 21, Jun 21 is unlocked but Jun 22+ is not
  const u = WC.unlockedDates(Date.parse('2026-06-21T12:00:00Z'));
  assert.ok(u.includes('2026-06-21'), 'today unlocked');
  assert.ok(!u.includes('2026-06-22'), 'tomorrow hidden');
  assert.ok(!u.includes('2026-06-27'), 'far future hidden');
  // no server time -> fall back to latest PLAYED date (2026-06-20); never reveal scheduled-only days
  const f = WC.unlockedDates(null);
  assert.ok(f.includes('2026-06-20'));
  assert.ok(!f.includes('2026-06-21'), 'no clock -> scheduled day stays hidden');
  // every match day is known across results + fixtures (full group stage)
  assert.equal(WC.allMatchDates().length, 17);
});

test('shouldFetch guard: throttle / no-new-games / due / no-more-matches', () => {
  const base = { latestResultDate: '2026-06-20', minIntervalMs: 60000 };
  // throttled: fetched 1s ago
  assert.equal(WC.shouldFetch(Object.assign({}, base, { serverNowMs: Date.parse('2026-06-21T20:00:00Z'), lastFetchMs: Date.parse('2026-06-21T19:59:59Z') })).reason, 'throttled');
  // no new games: now is still on Jun 20
  assert.equal(WC.shouldFetch(Object.assign({}, base, { serverNowMs: Date.parse('2026-06-20T23:00:00Z') })).reason, 'no-new-games');
  // due: Jun 21 has arrived
  assert.equal(WC.shouldFetch(Object.assign({}, base, { serverNowMs: Date.parse('2026-06-21T18:00:00Z') })).fetch, true);
  // nothing left on the schedule
  assert.equal(WC.shouldFetch({ latestResultDate: '2026-06-27', serverNowMs: Date.parse('2026-07-01T00:00:00Z') }).reason, 'no-more-matches');
});

test('formatError gives tight headlines + copyable detail', () => {
  const net = WC.formatError(new TypeError('Failed to fetch'));
  assert.equal(net.short, 'Failed: network error');
  assert.ok(net.long.length > 0);
  const http = WC.formatError(Object.assign(new Error('HTTP 503'), { status: 503, statusText: 'Service Unavailable' }));
  assert.equal(http.short, 'Failed: HTTP 503');
  assert.match(http.long, /503/);
  const ab = new Error('aborted'); ab.name = 'AbortError';
  assert.equal(WC.formatError(ab).short, 'Failed: request timed out');
  const sx = new Error('bad'); sx.name = 'SyntaxError';
  assert.equal(WC.formatError(sx).short, 'Failed: bad response');
  for (const s of ['network error', 'HTTP 503', 'request timed out', 'bad response'])
    assert.ok(('Failed: ' + s).split(' ').length <= 5, 'headline is 3–5 words');
});

test('nextBackoff grows exponentially', () => {
  assert.equal(WC.nextBackoff(0, 400), 400);
  assert.equal(WC.nextBackoff(1, 400), 800);
  assert.equal(WC.nextBackoff(2, 400), 1600);
});

test('withRetry: succeeds after transient failures, then gives up', async () => {
  let calls = 0;
  const okAfter3 = await WC.withRetry(async () => { calls++; if (calls < 3) throw new Error('flaky'); return 'ok'; }, { retries: 3, sleep: async () => {} });
  assert.equal(okAfter3, 'ok');
  assert.equal(calls, 3);

  let n = 0;
  await assert.rejects(() => WC.withRetry(async () => { n++; throw new Error('down'); }, { retries: 2, sleep: async () => {} }));
  assert.equal(n, 3); // initial + 2 retries
});

/* ---------------- integration: standings -> snapshot -> bracket pairings ---------------- */
test('integration: a snapshot flows through to full, valid R32 third-place pairings', () => {
  const state = WC.sortGroups(WC.buildState('ALL'));
  const ranked = WC.rankThirds(state);
  const qual = ranked.filter(t => t.qualified).map(t => t.g);
  const asg = WC.assignThirds(qual);
  assertValidAssignment(qual, asg);
  const byGroup = {}; state.forEach(g => byGroup[g.g] = g);
  // each pairing resolves to two real, named teams
  for (const s of WC.ELIG) {
    const winnerTeam = byGroup[s.win].teams[0].n;
    const thirdTeam = byGroup[asg[s.m]].teams[2].n;
    assert.ok(winnerTeam && thirdTeam, `match ${s.m} has both teams`);
  }
});
