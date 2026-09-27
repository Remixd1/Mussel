/**
 * Mussel mascot, 32x32. Original pixel art: a navy shell tilted up to the
 * right, hinge at the lower left, valves slightly open at the rim to show
 * the pearl interior.
 *
 * Shared by the <MusselLogo> component and scripts/generate-icons.mjs, so it
 * must stay dependency-free.
 *
 *   .  transparent   o  outline   n  shell navy   l  light navy   p  pearl
 */
export const MUSSEL_MAP: readonly string[] = [
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '....................ooooooo.....',
  '...................onnnnnnno....',
  '.................oolnnnnnnooo...',
  '................onlplnnnnoppo...',
  '...............onlplnnnoopppoo..',
  '..............olllnnnnopppoono..',
  '.............olllnnnoopooonnno..',
  '............olllnnnopoonnnnno...',
  '...........olllnnnooonnnnnnno...',
  '...........olnnnoonnnnnnnnoo....',
  '..........olnnnoonnnnnnnoo......',
  '.........olnnoonnnnnnnoo........',
  '........olnnoonnnnnooo..........',
  '.......olnnnnnnnooo.............',
  '.......onnnnnooo................',
  '......onnnooo...................',
  '.....onooo......................',
  '.....oo.........................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
];

export const MUSSEL_PALETTE: Readonly<Record<string, string>> = {
  o: '#14161A',
  n: '#1E2A44',
  l: '#34466B',
  p: '#EEF0E6',
};
