import { put } from './dom.js';
import { ADULT_DOSES, PEDS_DOSES, ALGORITHMS } from './data/resus.js';
import { REFERENCES } from './data/references.js';
import { evaluateLine, fillDoses, parseWeight } from './calc/resus.js';

// Weights are held only in this object and are never stored or sent.
const state = {
  acls: { weight: '', algo: 'acls-arrest', path: ['start'] },
  pals: { weight: '', algo: 'pals-arrest', path: ['start'] },
};

export function renderResus(h, kind, mount) {
  const s = state[kind];
  const doses = kind === 'acls' ? ADULT_DOSES : PEDS_DOSES;
  const algos = ALGORITHMS.filter((a) => a.kind === kind);
  const message = h('p', { class: 'field-error', id: 'kg-msg' });
  const trail = h('div', { class: 'trail-wrap' });
  const list = h('div', { class: 'dose-list' });
  const picker = h('div', { class: 'algo-picker', role: 'group', 'aria-label': 'Algorithm' });

  const current = () => algos.find((a) => a.id === s.algo);
  const weight = () => parseWeight(s.weight, kind);

  function drawPicker() {
    put(picker, ...algos.map((a) => h('button', {
      type: 'button', 'aria-pressed': String(a.id === s.algo),
      onclick: () => { s.algo = a.id; s.path = [a.start]; drawPicker(); drawTrail(); },
    }, a.name)));
  }

  function refLinks(ids) {
    return h('details', { class: 'sources' }, h('summary', {}, 'Sources'),
      h('ol', { class: 'row-refs' }, ids.map((id) => {
        const r = REFERENCES[id];
        return h('li', {}, r.url ? h('a', { href: r.url, target: '_blank', rel: 'noopener' }, r.cite) : r.cite,
          r.note && h('span', { class: 'ref-note' }, ` ${r.note}`));
      })));
  }

  function drawTrail() {
    const algo = current();
    const { kg } = weight();
    const steps = s.path.map((id, index) => {
      const step = algo.steps[id];
      const last = index === s.path.length - 1;
      return h('li', { class: `step${last ? ' now' : ''}` },
        h('h3', {}, step.title),
        h('ul', {}, step.lines.map((line) => h('li', {}, fillDoses(line, doses, kg)))),
        step.ask && last && step.branches.length > 0 && h('p', { class: 'ask' }, step.ask),
        last && step.branches.length > 0 && h('div', { class: 'branches' }, step.branches.map((b) => h('button', {
          type: 'button', onclick: () => { s.path.push(b.to); drawTrail(); trail.querySelector('.step.now')?.scrollIntoView({ block: 'nearest' }); },
        }, b.label))),
        !last && h('p', { class: 'chose' }, algo.steps[id].branches.find((b) => b.to === s.path[index + 1])?.label ?? ''));
    });
    put(trail, 
      h('ol', { class: 'trail' }, steps),
      h('div', { class: 'trail-actions' },
        s.path.length > 1 && h('button', { type: 'button', onclick: () => { s.path.pop(); drawTrail(); } }, 'Go back one step'),
        s.path.length > 1 && h('button', { type: 'button', onclick: () => { s.path = [algo.start]; drawTrail(); } }, 'Start over')),
      h('p', { class: 'status' }, 'Unverified: awaiting pharmacist review'),
      refLinks(algo.refs));
  }

  function drawDoses() {
    const { kg } = weight();
    const groups = new Map();
    doses.forEach((d) => { if (!groups.has(d.group)) groups.set(d.group, []); groups.get(d.group).push(d); });
    put(list, ...[...groups].map(([title, items]) => h('section', { class: 'group' },
      h('h2', {}, title),
      h('ul', { class: 'results' }, items.map((d) => h('li', { class: 'dose' },
        h('p', { class: 'dose-name' }, d.name, h('span', { class: 'route' }, d.route)),
        h('dl', {}, d.lines.flatMap((line) => {
          const out = evaluateLine(line, kg);
          return [
            h('dt', {}, line.label),
            h('dd', {},
              h('b', {}, out.dose),
              out.flag === 'max' && h('span', { class: 'capped' }, 'At maximum'),
              out.flag === 'min' && h('span', { class: 'capped' }, 'At minimum'),
              out.basis && h('span', { class: 'basis' }, out.basis)),
          ];
        })),
        d.note && h('p', { class: 'dose-note' }, d.note),
        h('p', { class: 'dose-status' }, 'Unverified'),
        refLinks(d.refs)))))));
  }

  function update() {
    const r = weight();
    message.textContent = r.error ?? r.warning ?? '';
    drawTrail();
    drawDoses();
  }

  const help = kind === 'acls'
    ? 'Only used for weight-based drugs: lidocaine, procainamide, dopamine, and some rate-control drugs.'
    : 'Every dose and shock below uses this weight.';

  const input = h('input', {
    id: 'kg', type: 'text', inputmode: 'decimal', autocomplete: 'off', value: s.weight, 'aria-describedby': 'kg-msg',
    oninput: (e) => { s.weight = e.target.value; update(); },
  });

  put(mount, 
    h('div', { class: 'code-head' },
      h('h1', {}, kind === 'acls' ? 'ACLS' : 'PALS'),
      h('div', { class: 'field kg' },
        h('label', { for: 'kg' }, 'Weight (kg)'),
        h('div', { class: 'control' }, input),
        h('p', { class: 'hint' }, help), message)),
    h('div', { class: 'code-grid' },
      h('section', { class: 'algo', 'aria-label': 'Algorithm' }, picker, trail),
      h('section', { 'aria-label': 'Doses' }, list)));
  drawPicker();
  update();
}
