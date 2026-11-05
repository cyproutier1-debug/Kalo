'use strict';
// Carte musculaire de Kalo : dessins de react-native-body-highlighter (licence MIT, voir vendor/BODY-MAP-LICENSE).
(() => {
  const MAP = { chest: 'pecs', deltoids: 'epaules', trapezius: 'trapezes', biceps: 'biceps', triceps: 'triceps', forearm: 'avantbras', abs: 'abdos', obliques: 'abdos', quadriceps: 'quadriceps', adductors: 'adducteurs', calves: 'mollets', tibialis: 'mollets', 'upper-back': 'dos', 'lower-back': 'lombaires', gluteal: 'fessiers', hamstring: 'ischios' };
  window.KaloBody = (side, fill, sex) => {
    const D = window.KALO_BODY_DATA; if (!D) return '';
    const v = D[sex === 'f' ? 'f' : 'm'][side === 'back' ? 'back' : 'front'];
    let s = `<svg viewBox="${v.vb}" class="body-svg" aria-label="Muscles, vue de ${side === 'back' ? 'dos' : 'face'}">`;
    for (const part of v.parts) {
      const k = MAP[part.s];
      const attr = k ? `data-m="${k}" style="fill:${fill(k)}"` : `class="${part.s === 'hair' ? 'body-hair' : 'body-skin'}"`;
      s += part.p.map(d => `<path ${attr} d="${d}"/>`).join('');
    }
    return s + `<path class="body-outline" d="${v.b}"/></svg>`;
  };
})();
