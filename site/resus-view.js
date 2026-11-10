import { put } from './dom.js';
import { ADULT_DOSES, PEDS_DOSES, ALGORITHMS, CATEGORIES, DOSE_CATEGORY, CHARTS } from './data/resus.js';
import { REFERENCES } from './data/references.js';
import { evaluateLine, parseWeight, BROSELOW, broselowZone } from './calc/resus.js';

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

  const zoneBox = h('div', { class: 'broselow' });
  const dialog = h('dialog', { class: 'chart-dialog', 'aria-label': 'Published algorithm' });

  const current = () => algos.find((a) => a.id === s.algo);

  // Algorithm text with each dose shown as a colored chip.
  function lineNodes(text, kg) {
    const parts = text.split(/(\{\{[\w-]+:\d+\}\})/);
    return parts.filter((x) => x !== '').map((part) => {
      const m = part.match(/^\{\{([\w-]+):(\d+)\}\}$/);
      if (!m) return part;
      const dose = doses.find((d) => d.id === m[1]);
      const line = dose?.lines[Number(m[2])];
      if (!line) throw new Error(`Unknown dose reference ${part}`);
      return h('mark', { class: `chip cat-${DOSE_CATEGORY[dose.id]}` }, evaluateLine(line, kg).dose);
    });
  }

  function openChart() {
    const ref = REFERENCES[CHARTS[s.algo]];
    put(dialog,
      h('div', { class: 'chart-head' },
        h('p', { class: 'chart-title' }, ref.cite),
        h('a', { href: ref.url, target: '_blank', rel: 'noopener' }, 'Open full size'),
        h('button', { type: 'button', class: 'chart-close', onclick: () => dialog.close() }, 'Close')),
      h('iframe', { src: ref.url, title: ref.cite, class: 'chart-frame' }),
      h('p', { class: 'hint' }, 'Loads from the publisher’s site, so it needs a connection. If it stays blank, choose Open full size.'));
    dialog.showModal();
  }

  function drawZone() {
    if (kind !== 'pals') return;
    const { kg } = weight();
    const zone = broselowZone(kg);
    put(zoneBox,
      h('div', { class: `zone-now ${zone ? `bz-${zone.id}` : 'bz-none'}` },
        zone ? [h('b', {}, zone.name), ` zone, ${zone.range}`]
          : kg === null ? 'Enter a weight or tap a color' : 'Outside the Broselow range (3 to 36 kg)'),
      h('div', { class: 'zone-row', role: 'group', 'aria-label': 'Broselow color' }, BROSELOW.map((z) => h('button', {
        type: 'button', class: `zone-btn bz-${z.id}`, 'aria-pressed': String(zone?.id === z.id),
        title: `${z.name}, ${z.range}`, 'aria-label': `${z.name}, ${z.range}`,
        onclick: () => { s.weight = String(z.mid); input.value = s.weight; update(); },
      }, z.name))),
      h('p', { class: 'hint' }, 'Tapping a color uses the middle of its weight range. Enter the measured weight when you have it.'));
  }
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
        h('ul', {}, step.lines.map((line) => h('li', {}, lineNodes(line, kg)))),
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
      refLinks(algo.refs));
  }

  function drawDoses() {
    const { kg } = weight();
    const groups = new Map();
    doses.forEach((d) => { if (!groups.has(d.group)) groups.set(d.group, []); groups.get(d.group).push(d); });
    put(list, h('div', { class: 'legend cats' }, CATEGORIES.filter((c) => doses.some((d) => DOSE_CATEGORY[d.id] === c.id)).map((c) => h('span', { class: `key-chip cat-${c.id}` }, c.label))),
      ...[...groups].map(([title, items]) => h('section', { class: 'group' },
      h('h2', {}, title),
      h('ul', { class: 'results' }, items.map((d) => h('li', { class: `dose cat-card cat-${DOSE_CATEGORY[d.id]}` },
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
        refLinks(d.refs)))))));
  }

  function update() {
    const r = weight();
    message.textContent = r.error ?? r.warning ?? '';
    drawZone();
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
        h('p', { class: 'hint' }, help), message),
      kind === 'pals' && zoneBox),
    h('div', { class: 'code-grid' },
      h('section', { class: 'algo', 'aria-label': 'Algorithm' }, picker,
        h('button', { type: 'button', class: 'chart-btn', onclick: openChart }, 'View published algorithm'), trail),
      h('section', { 'aria-label': 'Doses' }, list)),
    dialog);
  drawPicker();
  update();
}
