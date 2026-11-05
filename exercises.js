// Bibliothèque d'exercices de Kalo (noms usuels en français).
// Format : [id, nom, muscle principal, [muscles secondaires], équipement, type]
// type : 'w' = charge × répétitions, 'bw' = poids du corps (+ lest facultatif), 'time' = durée (s), 'cardio' = minutes + km
window.KALO_MUSCLES = {
  pecs: 'Pectoraux', dos: 'Dos', epaules: 'Épaules', trapezes: 'Trapèzes', biceps: 'Biceps', triceps: 'Triceps',
  avantbras: 'Avant-bras', abdos: 'Abdominaux', lombaires: 'Lombaires', quadriceps: 'Quadriceps', ischios: 'Ischio-jambiers',
  fessiers: 'Fessiers', adducteurs: 'Adducteurs', mollets: 'Mollets', cardio: 'Cardio',
};
window.KALO_EQUIP = { barre: 'Barre', halteres: 'Haltères', machine: 'Machine', poulie: 'Poulie', pdc: 'Poids du corps', smith: 'Smith machine', kettlebell: 'Kettlebell', autre: 'Autre' };
window.KALO_EXOS = [
  // Pectoraux
  ['dc-barre', 'Développé couché barre', 'pecs', ['triceps', 'epaules'], 'barre', 'w'],
  ['dc-halt', 'Développé couché haltères', 'pecs', ['triceps', 'epaules'], 'halteres', 'w'],
  ['di-barre', 'Développé incliné barre', 'pecs', ['epaules', 'triceps'], 'barre', 'w'],
  ['di-halt', 'Développé incliné haltères', 'pecs', ['epaules', 'triceps'], 'halteres', 'w'],
  ['dd-barre', 'Développé décliné barre', 'pecs', ['triceps'], 'barre', 'w'],
  ['dc-smith', 'Développé couché Smith machine', 'pecs', ['triceps', 'epaules'], 'smith', 'w'],
  ['di-smith', 'Développé incliné Smith machine', 'pecs', ['epaules', 'triceps'], 'smith', 'w'],
  ['presse-pec', 'Presse pectoraux machine', 'pecs', ['triceps'], 'machine', 'w'],
  ['ecarte-halt', 'Écarté couché haltères', 'pecs', [], 'halteres', 'w'],
  ['ecarte-poulie', 'Écarté à la poulie (vis-à-vis)', 'pecs', [], 'poulie', 'w'],
  ['pec-deck', 'Butterfly (pec deck)', 'pecs', [], 'machine', 'w'],
  ['pompes', 'Pompes', 'pecs', ['triceps', 'epaules'], 'pdc', 'bw'],
  ['dips', 'Dips', 'pecs', ['triceps', 'epaules'], 'pdc', 'bw'],
  // Dos
  ['tractions', 'Tractions', 'dos', ['biceps'], 'pdc', 'bw'],
  ['tirage-vert', 'Tirage vertical poulie haute', 'dos', ['biceps'], 'poulie', 'w'],
  ['tirage-horiz', 'Tirage horizontal poulie basse', 'dos', ['biceps', 'trapezes'], 'poulie', 'w'],
  ['rowing-barre', 'Rowing barre', 'dos', ['biceps', 'lombaires'], 'barre', 'w'],
  ['rowing-halt', 'Rowing haltère un bras', 'dos', ['biceps'], 'halteres', 'w'],
  ['rowing-machine', 'Rowing machine', 'dos', ['biceps'], 'machine', 'w'],
  ['tbar', 'Rowing T-bar', 'dos', ['biceps', 'trapezes'], 'barre', 'w'],
  ['tirage-bras-tendus', 'Tirage bras tendus poulie', 'dos', [], 'poulie', 'w'],
  ['pullover-poulie', 'Pull-over poulie', 'dos', ['pecs'], 'poulie', 'w'],
  ['sdt', 'Soulevé de terre', 'dos', ['ischios', 'fessiers', 'lombaires', 'trapezes'], 'barre', 'w'],
  // Épaules
  ['dm-barre', 'Développé militaire barre', 'epaules', ['triceps'], 'barre', 'w'],
  ['de-halt', 'Développé épaules haltères', 'epaules', ['triceps'], 'halteres', 'w'],
  ['de-smith', 'Développé épaules assis Smith machine', 'epaules', ['triceps'], 'smith', 'w'],
  ['de-machine', 'Développé épaules machine', 'epaules', ['triceps'], 'machine', 'w'],
  ['elev-lat-halt', 'Élévations latérales haltères', 'epaules', [], 'halteres', 'w'],
  ['elev-lat-poulie', 'Élévations latérales poulie', 'epaules', [], 'poulie', 'w'],
  ['elev-lat-machine', 'Élévations latérales machine', 'epaules', [], 'machine', 'w'],
  ['elev-front', 'Élévations frontales', 'epaules', [], 'halteres', 'w'],
  ['oiseau', 'Oiseau haltères (deltoïde postérieur)', 'epaules', ['trapezes'], 'halteres', 'w'],
  ['ecarte-inverse', 'Écartés inversés machine', 'epaules', ['trapezes'], 'machine', 'w'],
  ['face-pull', 'Face pull', 'epaules', ['trapezes'], 'poulie', 'w'],
  ['rowing-menton', 'Rowing menton', 'epaules', ['trapezes'], 'barre', 'w'],
  // Trapèzes
  ['shrug-halt', 'Haussements d\'épaules haltères', 'trapezes', [], 'halteres', 'w'],
  ['shrug-barre', 'Haussements d\'épaules barre', 'trapezes', [], 'barre', 'w'],
  // Biceps
  ['curl-barre', 'Curl barre', 'biceps', ['avantbras'], 'barre', 'w'],
  ['curl-ez', 'Curl barre EZ', 'biceps', ['avantbras'], 'barre', 'w'],
  ['curl-halt', 'Curl haltères', 'biceps', ['avantbras'], 'halteres', 'w'],
  ['curl-marteau', 'Curl marteau', 'biceps', ['avantbras'], 'halteres', 'w'],
  ['curl-incline', 'Curl incliné haltères', 'biceps', [], 'halteres', 'w'],
  ['curl-pupitre', 'Curl pupitre', 'biceps', [], 'machine', 'w'],
  ['curl-poulie', 'Curl poulie', 'biceps', [], 'poulie', 'w'],
  ['curl-concentre', 'Curl concentré', 'biceps', [], 'halteres', 'w'],
  // Triceps
  ['ext-corde', 'Extension triceps poulie (corde)', 'triceps', [], 'poulie', 'w'],
  ['ext-barre-poulie', 'Extension triceps poulie (barre)', 'triceps', [], 'poulie', 'w'],
  ['barre-front', 'Barre au front', 'triceps', [], 'barre', 'w'],
  ['ext-nuque', 'Extension nuque haltère', 'triceps', [], 'halteres', 'w'],
  ['dips-banc', 'Dips entre deux bancs', 'triceps', ['pecs'], 'pdc', 'bw'],
  ['dc-serre', 'Développé couché prise serrée', 'triceps', ['pecs'], 'barre', 'w'],
  ['kickback', 'Kickback triceps', 'triceps', [], 'halteres', 'w'],
  ['dips-machine', 'Dips machine', 'triceps', ['pecs'], 'machine', 'w'],
  // Avant-bras
  ['curl-poignets', 'Curl poignets', 'avantbras', [], 'barre', 'w'],
  ['farmer', 'Marche du fermier', 'avantbras', ['trapezes'], 'halteres', 'w'],
  // Abdominaux
  ['crunch', 'Crunch', 'abdos', [], 'pdc', 'bw'],
  ['crunch-machine', 'Crunch assis à la machine', 'abdos', [], 'machine', 'w'],
  ['crunch-poulie', 'Crunch à la poulie', 'abdos', [], 'poulie', 'w'],
  ['releve-jambes', 'Relevé de jambes suspendu', 'abdos', [], 'pdc', 'bw'],
  ['gainage', 'Gainage (planche)', 'abdos', ['lombaires'], 'pdc', 'time'],
  ['russian-twist', 'Russian twist', 'abdos', [], 'pdc', 'bw'],
  ['roue', 'Roue abdominale', 'abdos', [], 'autre', 'bw'],
  ['bucheron', 'Bûcheron à la poulie (obliques)', 'abdos', [], 'poulie', 'w'],
  // Lombaires
  ['ext-lombaires', 'Extension lombaires', 'lombaires', ['fessiers', 'ischios'], 'pdc', 'bw'],
  ['good-morning', 'Good morning', 'lombaires', ['ischios'], 'barre', 'w'],
  // Quadriceps
  ['squat', 'Squat barre', 'quadriceps', ['fessiers', 'ischios'], 'barre', 'w'],
  ['squat-smith', 'Squat Smith machine', 'quadriceps', ['fessiers'], 'smith', 'w'],
  ['front-squat', 'Squat avant', 'quadriceps', ['fessiers'], 'barre', 'w'],
  ['goblet', 'Goblet squat', 'quadriceps', ['fessiers'], 'halteres', 'w'],
  ['presse', 'Presse à cuisses', 'quadriceps', ['fessiers'], 'machine', 'w'],
  ['hack-squat', 'Hack squat', 'quadriceps', ['fessiers'], 'machine', 'w'],
  ['leg-ext', 'Leg extension', 'quadriceps', [], 'machine', 'w'],
  ['fentes', 'Fentes haltères', 'quadriceps', ['fessiers'], 'halteres', 'w'],
  ['bulgare', 'Squat bulgare', 'quadriceps', ['fessiers'], 'halteres', 'w'],
  // Ischio-jambiers
  ['leg-curl-allonge', 'Leg curl allongé', 'ischios', [], 'machine', 'w'],
  ['leg-curl-assis', 'Leg curl assis', 'ischios', [], 'machine', 'w'],
  ['sdt-roumain', 'Soulevé de terre roumain', 'ischios', ['fessiers', 'lombaires'], 'barre', 'w'],
  ['sdt-jt', 'Soulevé de terre jambes tendues haltères', 'ischios', ['fessiers'], 'halteres', 'w'],
  // Fessiers
  ['hip-thrust', 'Hip thrust', 'fessiers', ['ischios'], 'barre', 'w'],
  ['pont-fessier', 'Pont fessier', 'fessiers', ['ischios'], 'pdc', 'bw'],
  ['abducteurs', 'Abducteurs machine', 'fessiers', [], 'machine', 'w'],
  ['kickback-fessier', 'Kickback fessier poulie', 'fessiers', [], 'poulie', 'w'],
  // Adducteurs
  ['adducteurs', 'Adducteurs machine', 'adducteurs', [], 'machine', 'w'],
  // Mollets
  ['mollets-debout', 'Mollets debout', 'mollets', [], 'machine', 'w'],
  ['mollets-assis', 'Mollets assis', 'mollets', [], 'machine', 'w'],
  ['mollets-presse', 'Mollets à la presse', 'mollets', [], 'machine', 'w'],
  // Cardio
  ['tapis', 'Tapis de course', 'cardio', [], 'machine', 'cardio'],
  ['velo', 'Vélo d\'appartement', 'cardio', [], 'machine', 'cardio'],
  ['rameur', 'Rameur', 'cardio', ['dos'], 'machine', 'cardio'],
  ['elliptique', 'Vélo elliptique', 'cardio', [], 'machine', 'cardio'],
  ['stairs', 'Escaliers (stepper)', 'cardio', ['fessiers'], 'machine', 'cardio'],
  ['corde', 'Corde à sauter', 'cardio', ['mollets'], 'autre', 'time'],
];
