'use strict';
// Carte musculaire de Kalo : dessins de react-native-body-highlighter (licence MIT, voir vendor/BODY-MAP-LICENSE).
(() => {
  const MAP = { chest: 'pecs', deltoids: 'epaules', trapezius: 'trapezes', biceps: 'biceps', triceps: 'triceps', forearm: 'avantbras', abs: 'abdos', obliques: 'abdos', quadriceps: 'quadriceps', adductors: 'adducteurs', calves: 'mollets', tibialis: 'mollets', 'upper-back': 'dos', 'lower-back': 'lombaires', gluteal: 'fessiers', hamstring: 'ischios' };
  // Cadrage identique face / dos (boîte englobante de chaque dessin + marge de 20)
  const box = (x, y, w, h) => `${x - 20} ${y - 20} ${w + 40} ${h + 40}`;
  const VB = { mfront: box(49, 96, 630, 1255), mback: box(769, 97, 630, 1255), ffront: box(0, 0, 641, 1433), fback: box(822, 0, 641, 1433) };
  window.KaloBody = (side, fill, sex) => {
    const D = window.KALO_BODY_DATA; if (!D) return '';
    const key = (sex === 'f' ? 'f' : 'm') + (side === 'back' ? 'back' : 'front'), v = D[key[0]][key.slice(1)];
    let s = `<svg viewBox="${VB[key]}" class="body-svg" aria-label="Muscles, vue de ${side === 'back' ? 'dos' : 'face'}">`;
    for (const part of v.parts) {
      const k = MAP[part.s];
      const attr = k ? `data-m="${k}" style="fill:${fill(k)}"` : `class="${part.s === 'hair' ? 'body-hair' : 'body-skin'}"`;
      s += part.p.map(d => `<path ${attr} d="${d}"/>`).join('');
    }
    return s + `<path class="body-outline" d="${v.b}"/></svg>`;
  };
})();
