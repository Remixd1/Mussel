/**
 * How-to guides for the seed exercises (CLAUDE.md §5.6): description, steps,
 * tips, target muscles, and a two-frame animation of the lab's stick figure
 * (start and finish), with equipment and blue movement arrows.
 *
 * Poses are drawn on the pictogram grid (floor at y = 44, figure facing
 * right). See src/lib/guide/poseArt.ts for how they render.
 */
import {
  arrow,
  bench,
  cable,
  curve,
  dumbbell,
  plate,
  type GuideFrame,
  type Muscle,
} from '../lib/guide/poseArt';

export interface ExerciseGuide {
  summary: string;
  steps: string[];
  tips: string[];
  primary: Muscle[];
  secondary: Muscle[];
  /** Start and finish positions. */
  frames: [GuideFrame, GuideFrame];
}

/** Standing figure helpers (facing right). */
const STAND = {
  head: [24, 7],
  neck: [24, 12],
  hip: [24, 25],
  knee: [24.5, 34],
  ankle: [24, 43],
} as const;

export const EXERCISE_GUIDES: Record<string, ExerciseGuide> = {
  'back-squat': {
    summary:
      'The barbell sits across your upper back while you sit your hips down between your heels and stand back up. The foundation lower-body lift.',
    steps: [
      'Set the bar in a rack at mid-chest height. Step under it and rest it on your upper back, not your neck.',
      'Grip the bar just outside your shoulders, stand it up, and take two or three steps back. Feet about shoulder width, toes slightly out.',
      'Brace your core, then bend at the hips and knees together. Keep your chest up and knees tracking over your toes.',
      'Descend until your hips are at least level with your knees, then drive up through your whole foot to stand.',
    ],
    tips: [
      'Take a big breath and hold it on the way down; exhale near the top.',
      'Keep your heels down the whole time.',
      'Use safety bars set just below your bottom position.',
    ],
    primary: ['quads', 'glutes'],
    secondary: ['hamstrings', 'lower-back', 'core'],
    frames: [
      {
        pose: { ...STAND, elbow: [18.5, 19.5], hand: [20, 14.5] },
        props: plate(19.5, 14.5, 4.5),
        arrows: [arrow([40, 12], [40, 32])],
      },
      {
        pose: {
          head: [25.5, 15],
          neck: [22, 19],
          hip: [14, 31],
          elbow: [15.5, 27],
          hand: [17.5, 21.5],
          knee: [25, 31.5],
          ankle: [22.5, 43],
        },
        props: plate(17.5, 21.5, 4.5),
        arrows: [arrow([40, 34], [40, 14])],
      },
    ],
  },

  'front-squat': {
    summary:
      'A squat with the bar resting on the front of your shoulders. It keeps your torso more upright and puts more of the work on your quads.',
    steps: [
      'Unrack the bar onto the front of your shoulders, close to your throat, with elbows pointing forward and high.',
      'Hold the bar with your fingertips or cross your arms over it. Feet shoulder width.',
      'Brace and squat straight down, keeping your elbows up and your chest tall.',
      'Go as deep as you can while staying upright, then stand back up.',
    ],
    tips: [
      'If the bar rolls forward, lift your elbows higher.',
      'Wrist mobility helps; a cross-arm grip is fine.',
    ],
    primary: ['quads'],
    secondary: ['glutes', 'core', 'upper-back'],
    frames: [
      {
        pose: { ...STAND, elbow: [30, 15], hand: [27, 12] },
        front: plate(29, 12.5, 4.5),
        arrows: [arrow([41, 12], [41, 32])],
      },
      {
        pose: {
          head: [20.5, 14],
          neck: [18, 18.5],
          hip: [15, 31],
          elbow: [24.5, 21.5],
          hand: [21.5, 18],
          knee: [26, 31.5],
          ankle: [23, 43],
        },
        front: plate(24.5, 19, 4.5),
        arrows: [arrow([41, 34], [41, 14])],
      },
    ],
  },

  'leg-press': {
    summary:
      'Seated in a machine, you push a weighted platform away with your legs. Heavy quad and glute work with your back supported.',
    steps: [
      'Sit with your back flat against the pad and place your feet shoulder width in the middle of the platform.',
      'Push the platform up and release the safety handles.',
      'Lower the platform by bending your knees toward your chest, keeping your lower back on the pad.',
      'Press back up until your legs are almost straight, without locking your knees.',
    ],
    tips: [
      "Don't let your hips curl off the seat at the bottom.",
      'Higher foot placement shifts work to glutes and hamstrings.',
    ],
    primary: ['quads', 'glutes'],
    secondary: ['hamstrings'],
    frames: [
      {
        pose: {
          head: [7, 16],
          neck: [9.5, 20.5],
          hip: [15, 32],
          elbow: [13, 27],
          hand: [17, 31],
          knee: [21, 21],
          ankle: [29, 27],
          toe: [30, 23],
        },
        props: [
          { l: [4, 15, 13, 35], w: 3 },
          { l: [8, 36, 22, 36], w: 3 },
          { l: [31, 19, 33.5, 31], w: 3 },
        ],
        arrows: [arrow([34, 37], [42, 31])],
      },
      {
        pose: {
          head: [7, 16],
          neck: [9.5, 20.5],
          hip: [15, 32],
          elbow: [13, 27],
          hand: [17, 31],
          knee: [25, 28.5],
          ankle: [35, 25],
          toe: [36, 21],
        },
        props: [
          { l: [4, 15, 13, 35], w: 3 },
          { l: [8, 36, 22, 36], w: 3 },
          { l: [37, 17, 39.5, 29], w: 3 },
        ],
        arrows: [arrow([42, 34], [34, 40])],
      },
    ],
  },

  'leg-extension': {
    summary:
      'Seated in a machine, you straighten your knees against a padded roller. Isolates the quads.',
    steps: [
      'Adjust the seat so your knees line up with the machine pivot and the pad sits on your lower shins.',
      'Hold the handles and sit tall against the back pad.',
      'Straighten your legs until they are fully extended, squeezing your quads at the top.',
      'Lower under control until your knees are bent about 90 degrees.',
    ],
    tips: ['Pause for a second at the top.', "Don't swing the weight up with momentum."],
    primary: ['quads'],
    secondary: [],
    frames: [
      {
        pose: {
          head: [17, 8],
          neck: [17, 13],
          hip: [18, 30],
          elbow: [19, 22],
          hand: [22, 31],
          knee: [29, 30],
          ankle: [29.5, 41],
          toe: [33, 42],
        },
        props: [{ r: [12, 31, 18, 3, 1] }, { r: [12, 12, 3, 20, 1] }, { r: [17, 34, 3, 10] }],
        front: [{ c: [32.5, 39.5, 2.4] }],
        arrows: curve([36, 38], [41, 33], [39, 25]),
      },
      {
        pose: {
          head: [17, 8],
          neck: [17, 13],
          hip: [18, 30],
          elbow: [19, 22],
          hand: [22, 31],
          knee: [29, 30],
          ankle: [39.5, 27],
          toe: [42, 23],
        },
        props: [{ r: [12, 31, 18, 3, 1] }, { r: [12, 12, 3, 20, 1] }, { r: [17, 34, 3, 10] }],
        front: [{ c: [40.5, 30.5, 2.4] }],
        arrows: curve([42, 34], [41, 40], [35, 42]),
      },
    ],
  },

  'leg-curl': {
    summary:
      'Lying face down on a machine, you curl a padded roller toward your glutes. Isolates the hamstrings.',
    steps: [
      'Lie face down with your knees just off the end of the pad and the roller above your heels.',
      'Hold the handles and keep your hips pressed into the bench.',
      'Curl your heels toward your glutes as far as you can.',
      'Lower slowly until your legs are almost straight.',
    ],
    tips: [
      "Don't let your hips lift off the pad.",
      'Control the lowering; it builds the most strength.',
    ],
    primary: ['hamstrings'],
    secondary: ['calves'],
    frames: [
      {
        pose: {
          facing: -1,
          head: [6, 24],
          neck: [10, 27],
          hip: [24, 27],
          elbow: [9, 32],
          hand: [5, 31],
          knee: [33.5, 27],
          ankle: [43, 27],
          toe: [44, 31],
        },
        props: bench(4, 30, 30),
        front: [{ c: [42, 24, 2.4] }],
        arrows: curve([44, 20], [43, 12], [36, 11]),
      },
      {
        pose: {
          facing: -1,
          head: [6, 24],
          neck: [10, 27],
          hip: [24, 27],
          elbow: [9, 32],
          hand: [5, 31],
          knee: [33.5, 27],
          ankle: [35, 17.5],
          toe: [39, 16],
        },
        props: bench(4, 30, 30),
        front: [{ c: [32.5, 17, 2.4] }],
        arrows: curve([40, 12], [45, 15], [45, 24]),
      },
    ],
  },

  lunge: {
    summary:
      'Step forward into a split stance and lower your back knee toward the floor, then stand back up. Trains each leg on its own.',
    steps: [
      'Stand tall with feet hip width, holding dumbbells at your sides if you like.',
      'Take a long step forward with one leg.',
      'Lower until your back knee is just above the floor and your front thigh is about parallel.',
      'Drive through your front heel to stand, then step through with the other leg.',
    ],
    tips: ['Keep your torso upright.', 'Front knee tracks over your toes, not inward.'],
    primary: ['quads', 'glutes'],
    secondary: ['hamstrings', 'core'],
    frames: [
      {
        pose: {
          ...STAND,
          elbow: [24.5, 18.5],
          hand: [24.5, 25.5],
          knee2: [23, 34],
          ankle2: [21, 43],
        },
        front: dumbbell(24.5, 27),
        arrows: [arrow([38, 12], [38, 30])],
      },
      {
        pose: {
          head: [23, 12],
          neck: [23, 17],
          hip: [22.5, 30],
          elbow: [23.5, 23.5],
          hand: [23.5, 30.5],
          knee: [31.5, 31],
          ankle: [31, 43],
          knee2: [17, 40],
          ankle2: [9, 41],
          toe2: [7, 44],
        },
        front: dumbbell(23.5, 32),
        arrows: [arrow([42, 32], [42, 14])],
      },
    ],
  },

  'calf-raise': {
    summary: 'Rise up onto the balls of your feet and lower back down. Builds the calves.',
    steps: [
      'Stand with the balls of your feet on a step or plate, heels free. Hold something for balance if needed.',
      'Lower your heels as far as is comfortable for a full stretch.',
      'Push up onto your toes as high as you can.',
      'Pause at the top, then lower slowly.',
    ],
    tips: ['Keep your knees straight but not locked.', 'Go slow; calves respond to full range.'],
    primary: ['calves'],
    secondary: [],
    frames: [
      {
        pose: { ...STAND, elbow: [24.5, 18.5], hand: [24.5, 25.5], toe: [29, 43] },
        front: dumbbell(24.5, 27),
        arrows: [arrow([38, 36], [38, 24])],
      },
      {
        pose: {
          head: [24, 3.5],
          neck: [24, 8.5],
          hip: [24, 21.5],
          elbow: [24.5, 15],
          hand: [24.5, 22],
          knee: [24.5, 30.5],
          ankle: [25, 39],
          toe: [29, 43],
        },
        front: dumbbell(24.5, 23.5),
        arrows: [arrow([38, 22], [38, 34])],
      },
    ],
  },

  deadlift: {
    summary:
      'Lift a loaded barbell from the floor to standing by driving your hips forward. Works almost your whole back side.',
    steps: [
      'Stand with the bar over the middle of your feet, feet hip width.',
      'Hinge down and grip the bar just outside your legs. Shins touch the bar, back flat, chest up.',
      'Brace, push the floor away with your legs, and keep the bar dragging up your legs.',
      'Stand tall with hips through, then lower the bar the same way under control.',
    ],
    tips: [
      'Keep your back flat from start to finish; never round to reach the bar.',
      'Squeeze your lats ("bend the bar") before you pull.',
    ],
    primary: ['glutes', 'hamstrings', 'lower-back'],
    secondary: ['quads', 'lats', 'forearms'],
    frames: [
      {
        pose: {
          head: [31, 14.5],
          neck: [28, 18.5],
          hip: [17.5, 25],
          elbow: [28, 27],
          hand: [28, 35.5],
          knee: [25, 32],
          ankle: [22.5, 43],
        },
        front: plate(28, 38, 6),
        arrows: [arrow([42, 34], [42, 14])],
      },
      {
        pose: { ...STAND, elbow: [25, 19], hand: [25.5, 27] },
        front: plate(25.5, 27.5, 6),
        arrows: [arrow([42, 12], [42, 32])],
      },
    ],
  },

  rdl: {
    summary:
      'From standing, push your hips back and lower the bar down your thighs with soft knees, then return. Targets the hamstrings and glutes.',
    steps: [
      'Stand tall holding the bar at your hips, hands just outside your thighs.',
      'Unlock your knees slightly and push your hips back, letting the bar slide down your thighs.',
      'Lower until you feel a strong hamstring stretch, usually just below the knees, with your back flat.',
      'Drive your hips forward to stand back up.',
    ],
    tips: ['Think hips back, not bar down.', 'The bar stays touching your legs the whole time.'],
    primary: ['hamstrings', 'glutes'],
    secondary: ['lower-back', 'forearms'],
    frames: [
      {
        pose: { ...STAND, elbow: [25, 19], hand: [25.5, 27] },
        front: plate(25.5, 27.5, 6),
        arrows: curve([38, 12], [44, 18], [42, 26]),
      },
      {
        pose: {
          head: [34.5, 21],
          neck: [30, 23.5],
          hip: [17, 23],
          elbow: [30, 30],
          hand: [30, 36.5],
          knee: [21, 33],
          ankle: [21, 43],
        },
        front: plate(30, 37, 6),
        arrows: curve([42, 30], [44, 20], [38, 13]),
      },
    ],
  },

  'hip-thrust': {
    summary:
      'With your upper back on a bench and a bar across your hips, you drive your hips up until your body is straight from knees to shoulders. Builds the glutes.',
    steps: [
      'Sit on the floor with your upper back against a bench and a padded bar over your hips.',
      'Plant your feet flat, about hip width, so your shins are vertical at the top.',
      'Drive through your heels and push your hips up until your torso is level with the floor.',
      'Squeeze your glutes hard at the top, then lower under control.',
    ],
    tips: ['Tuck your chin and keep your ribs down.', "Don't arch your lower back to get higher."],
    primary: ['glutes'],
    secondary: ['hamstrings', 'core'],
    frames: [
      {
        pose: {
          head: [8, 21],
          neck: [12.5, 24],
          hip: [19, 36],
          elbow: [15, 30],
          hand: [19, 33],
          knee: [29, 30],
          ankle: [31.5, 43],
        },
        props: bench(2, 26, 12),
        front: plate(19, 33, 5.5),
        arrows: [arrow([23, 42], [23, 34])],
      },
      {
        pose: {
          head: [8, 21],
          neck: [12.5, 24],
          hip: [23, 25],
          elbow: [17, 23],
          hand: [22.5, 22.5],
          knee: [32, 27],
          ankle: [32.5, 43],
        },
        props: bench(2, 26, 12),
        front: plate(23, 22.5, 5.5),
        arrows: [arrow([23, 36], [23, 42])],
      },
    ],
  },

  'bench-press': {
    summary:
      'Lying on a flat bench, you lower a barbell to your chest and press it back up. The main upper-body pushing lift.',
    steps: [
      'Lie on the bench with your eyes under the bar, feet flat on the floor.',
      'Grip slightly wider than shoulder width, squeeze your shoulder blades together, and unrack.',
      'Lower the bar to your mid chest with elbows about 45 degrees from your body.',
      'Press back up until your arms are straight over your shoulders.',
    ],
    tips: [
      'Keep your shoulder blades pinned and your butt on the bench.',
      'Always use a spotter or safety arms for heavy sets.',
    ],
    primary: ['chest', 'triceps'],
    secondary: ['front-delts'],
    frames: [
      {
        pose: {
          head: [7, 26],
          neck: [11.5, 28.5],
          hip: [25, 28.5],
          elbow: [12, 35],
          hand: [15.5, 26],
          knee: [32.5, 24],
          ankle: [34.5, 43],
        },
        props: bench(4, 31, 28),
        front: plate(15.5, 25, 6),
        arrows: [arrow([40, 30], [40, 12])],
      },
      {
        pose: {
          head: [7, 26],
          neck: [11.5, 28.5],
          hip: [25, 28.5],
          elbow: [13, 20.5],
          hand: [14, 12.5],
          knee: [32.5, 24],
          ankle: [34.5, 43],
        },
        props: bench(4, 31, 28),
        front: plate(14, 12, 6),
        arrows: [arrow([40, 12], [40, 30])],
      },
    ],
  },

  'incline-bench': {
    summary:
      'A bench press on a bench set to about 30 to 45 degrees. Shifts more of the work to the upper chest and front shoulders.',
    steps: [
      'Set the bench to a low incline and lie back with your feet flat.',
      'Grip slightly wider than shoulder width and unrack the bar over your upper chest.',
      'Lower the bar to just below your collarbones.',
      'Press straight up until your arms are locked out.',
    ],
    tips: [
      'A lower incline keeps more chest involvement.',
      'Keep your shoulder blades pulled back.',
    ],
    primary: ['chest', 'front-delts'],
    secondary: ['triceps'],
    frames: [
      {
        pose: {
          head: [10, 15.5],
          neck: [13, 20],
          hip: [21, 34],
          elbow: [11, 27],
          hand: [16.5, 20],
          knee: [30, 33],
          ankle: [31.5, 43],
        },
        props: [{ l: [8, 22, 17, 38], w: 3 }, { r: [14, 37, 12, 3, 1] }, { r: [18, 40, 2.5, 4] }],
        front: plate(17, 19.5, 6),
        arrows: [arrow([38, 24], [38, 6])],
      },
      {
        pose: {
          head: [10, 15.5],
          neck: [13, 20],
          hip: [21, 34],
          elbow: [16, 12.5],
          hand: [18, 4.5],
          knee: [30, 33],
          ankle: [31.5, 43],
        },
        props: [{ l: [8, 22, 17, 38], w: 3 }, { r: [14, 37, 12, 3, 1] }, { r: [18, 40, 2.5, 4] }],
        front: plate(18, 4, 6),
        arrows: [arrow([38, 6], [38, 24])],
      },
    ],
  },

  ohp: {
    summary:
      'Standing, you press a barbell from your shoulders to straight overhead. Builds the shoulders and triceps.',
    steps: [
      'Hold the bar at the front of your shoulders, hands just outside shoulder width, elbows slightly in front of the bar.',
      'Brace your core and squeeze your glutes so you stay upright.',
      'Press the bar straight up, moving your head back slightly to let it pass.',
      'Lock out overhead with the bar over the middle of your feet, then lower to your shoulders.',
    ],
    tips: [
      "Don't lean back to finish the rep.",
      'Push your head "through the window" once the bar passes it.',
    ],
    primary: ['front-delts', 'triceps'],
    secondary: ['side-delts', 'core', 'upper-back'],
    frames: [
      {
        pose: { ...STAND, elbow: [28.5, 17], hand: [27, 11] },
        front: plate(27, 10.5, 5.5),
        arrows: [arrow([40, 18], [40, 0])],
      },
      {
        pose: { ...STAND, head: [23, 7], elbow: [24.5, 4], hand: [25, -3.5] },
        front: plate(25, -2.5, 5),
        arrows: [arrow([40, 0], [40, 18])],
      },
    ],
  },

  dip: {
    summary:
      'Supporting yourself on parallel bars, you lower your body by bending your elbows and press back up. Hits chest and triceps.',
    steps: [
      'Grip the bars and lift yourself up with your arms straight.',
      'Lean slightly forward and bend your knees to keep your feet clear.',
      'Lower until your upper arms are about parallel to the floor.',
      'Press back up to straight arms.',
    ],
    tips: [
      'Stop if you feel pain in the front of your shoulders.',
      'More forward lean means more chest.',
    ],
    primary: ['chest', 'triceps'],
    secondary: ['front-delts'],
    frames: [
      {
        pose: {
          head: [25.5, 7],
          neck: [23, 11.5],
          hip: [20, 24.5],
          elbow: [23, 18.5],
          hand: [23, 25.5],
          knee: [21.5, 33.5],
          ankle: [15, 37],
        },
        props: [{ r: [12, 25.5, 22, 2.4, 1] }, { r: [31, 27, 2.4, 17] }],
        arrows: [arrow([40, 10], [40, 26])],
      },
      {
        pose: {
          head: [27.5, 15],
          neck: [24, 18.5],
          hip: [20, 31],
          elbow: [16.5, 22],
          hand: [23, 25.5],
          knee: [21, 39.5],
          ankle: [14, 42],
        },
        props: [{ r: [12, 25.5, 22, 2.4, 1] }, { r: [31, 27, 2.4, 17] }],
        arrows: [arrow([40, 28], [40, 12])],
      },
    ],
  },

  pushup: {
    summary:
      'From a straight plank on your hands, you lower your chest to the floor and push back up. A bodyweight press that also trains your core.',
    steps: [
      'Start in a plank with hands just wider than your shoulders and your body in a straight line.',
      'Brace your core and squeeze your glutes.',
      'Lower your chest toward the floor, elbows about 45 degrees from your body.',
      'Push the floor away until your arms are straight.',
    ],
    tips: [
      "Don't let your hips sag or pike up.",
      'Elevate your hands on a bench to make it easier.',
    ],
    primary: ['chest', 'triceps'],
    secondary: ['front-delts', 'core'],
    frames: [
      {
        pose: {
          head: [36.5, 26],
          neck: [32, 29.5],
          hip: [19, 35],
          elbow: [32, 36.5],
          hand: [32, 43],
          knee: [12, 38.5],
          ankle: [5, 42],
          toe: [4, 44],
        },
        arrows: [arrow([42, 24], [42, 38])],
      },
      {
        pose: {
          head: [36.5, 34.5],
          neck: [31.5, 37.5],
          hip: [18.5, 39.5],
          elbow: [25.5, 37],
          hand: [32, 43],
          knee: [11.5, 41],
          ankle: [5, 42.5],
          toe: [4, 44],
        },
        arrows: [arrow([42, 38], [42, 24])],
      },
    ],
  },

  'chest-fly': {
    summary:
      'Lying on a bench with dumbbells, you open your arms wide in an arc and bring them back together over your chest. Isolates the chest.',
    steps: [
      'Lie on a flat bench holding dumbbells over your chest, palms facing each other.',
      'Keep a slight bend in your elbows and lock it there.',
      'Open your arms out to the sides in a wide arc until you feel a chest stretch.',
      'Bring the dumbbells back together over your chest by squeezing your pecs.',
    ],
    tips: [
      'Think "hug a tree" rather than pressing.',
      'Use light weights; the stretch does the work.',
    ],
    primary: ['chest'],
    secondary: ['front-delts'],
    frames: [
      {
        pose: {
          head: [7, 26],
          neck: [11.5, 28.5],
          hip: [25, 28.5],
          elbow: [13, 21],
          hand: [14.5, 13.5],
          knee: [32.5, 24],
          ankle: [34.5, 43],
        },
        props: bench(4, 31, 28),
        front: dumbbell(14.5, 12.5),
        arrows: curve([22, 13], [26, 26], [20, 38]),
      },
      {
        pose: {
          head: [7, 26],
          neck: [11.5, 28.5],
          hip: [25, 28.5],
          elbow: [12.5, 35],
          hand: [14, 40],
          knee: [32.5, 24],
          ankle: [34.5, 43],
        },
        props: bench(4, 31, 28),
        front: dumbbell(14, 40),
        arrows: curve([22, 40], [26, 27], [21, 14]),
      },
    ],
  },

  'lateral-raise': {
    summary:
      'Standing with dumbbells at your sides, you raise your arms out to shoulder height. Builds the side of the shoulders. Shown front-on.',
    steps: [
      'Stand tall holding dumbbells at your sides, palms facing in.',
      'Keep a slight bend in your elbows.',
      'Raise the dumbbells out to the sides until your arms are level with your shoulders.',
      'Lower slowly back to your sides.',
    ],
    tips: [
      'Lead with your elbows, not your hands.',
      'No swinging; go lighter if you need momentum.',
    ],
    primary: ['side-delts'],
    secondary: ['upper-back'],
    frames: [
      {
        pose: {
          solidPair: true,
          head: [24, 7],
          neck: [24, 12],
          hip: [24, 25],
          elbow: [19.5, 18],
          hand: [18, 25.5],
          elbow2: [28.5, 18],
          hand2: [30, 25.5],
          knee: [21.5, 34],
          ankle: [20.5, 43],
          toe: [17.5, 43],
          knee2: [26.5, 34],
          ankle2: [27.5, 43],
          toe2: [30.5, 43],
        },
        front: [...dumbbell(18, 27), ...dumbbell(30, 27)],
        arrows: [...curve([12, 28], [8, 22], [9, 15]), ...curve([36, 28], [40, 22], [39, 15])],
      },
      {
        pose: {
          solidPair: true,
          head: [24, 7],
          neck: [24, 12],
          hip: [24, 25],
          elbow: [16, 12.5],
          hand: [8.5, 13],
          elbow2: [32, 12.5],
          hand2: [39.5, 13],
          knee: [21.5, 34],
          ankle: [20.5, 43],
          toe: [17.5, 43],
          knee2: [26.5, 34],
          ankle2: [27.5, 43],
          toe2: [30.5, 43],
        },
        front: [...dumbbell(7.5, 13), ...dumbbell(40.5, 13)],
        arrows: [...curve([7, 20], [8, 26], [14, 29]), ...curve([41, 20], [40, 26], [34, 29])],
      },
    ],
  },

  'tricep-pushdown': {
    summary:
      'At a cable stack with a bar or rope, you push the handle down by straightening your elbows. Isolates the triceps.',
    steps: [
      'Stand facing a high cable and grip the handle with elbows tucked at your sides.',
      'Lean forward slightly and lock your upper arms in place.',
      'Push the handle down until your arms are fully straight.',
      'Let it rise back up to about chest height without moving your elbows.',
    ],
    tips: ['Only your forearms should move.', 'Squeeze at the bottom for a second.'],
    primary: ['triceps'],
    secondary: [],
    frames: [
      {
        pose: { ...STAND, hip: [23.5, 25], elbow: [24.5, 20.5], hand: [31, 16.5] },
        props: [{ r: [41, 0, 3, 44, 1] }, ...cable([39, 2], [31, 16.5])],
        front: [{ r: [29.5, 15, 4, 3, 1] }],
        arrows: curve([35, 22], [37, 28], [32, 32]),
      },
      {
        pose: { ...STAND, hip: [23.5, 25], elbow: [24.5, 20.5], hand: [26, 28.5] },
        props: [{ r: [41, 0, 3, 44, 1] }, ...cable([39, 2], [26, 28.5])],
        front: [{ r: [24.5, 27, 4, 3, 1] }],
        arrows: curve([31, 31], [36, 28], [35, 21]),
      },
    ],
  },

  pullup: {
    summary:
      'Hanging from a bar, you pull yourself up until your chin clears it. The classic back and biceps builder.',
    steps: [
      'Hang from the bar with hands just wider than your shoulders, palms facing away.',
      'Pull your shoulder blades down and back to start the movement.',
      'Pull your chest toward the bar until your chin is over it.',
      'Lower all the way down to straight arms.',
    ],
    tips: ['No kipping or swinging.', 'Use a band or the assisted machine to build up.'],
    primary: ['lats', 'biceps'],
    secondary: ['upper-back', 'rear-delts', 'forearms'],
    frames: [
      {
        pose: {
          head: [27, 12.5],
          neck: [24, 16.5],
          hip: [23, 29],
          elbow: [25, 9.5],
          hand: [25.5, 2.5],
          knee: [24.5, 37.5],
          ankle: [19.5, 41.5],
        },
        props: [{ r: [8, 0.5, 32, 2.4, 1] }],
        arrows: [arrow([40, 30], [40, 12])],
      },
      {
        pose: {
          head: [27.5, -3],
          neck: [24, 1.5],
          hip: [23, 14],
          elbow: [18.5, 7.5],
          hand: [25.5, 2.5],
          knee: [24.5, 22.5],
          ankle: [19.5, 26.5],
        },
        props: [{ r: [8, 0.5, 32, 2.4, 1] }],
        arrows: [arrow([40, 12], [40, 30])],
      },
    ],
  },

  'lat-pulldown': {
    summary:
      'Seated at a cable machine, you pull a wide bar down to your upper chest. A pull-up alternative for building the back.',
    steps: [
      'Adjust the knee pad so your thighs are locked in, then grip the bar wider than your shoulders.',
      'Sit tall with a slight lean back and your chest up.',
      'Pull the bar down to your upper chest, driving your elbows down and back.',
      'Let the bar rise slowly until your arms are straight.',
    ],
    tips: [
      "Don't yank with your lower back.",
      'Think about pulling with your elbows, not your hands.',
    ],
    primary: ['lats'],
    secondary: ['biceps', 'rear-delts', 'upper-back'],
    frames: [
      {
        pose: {
          head: [19, 15],
          neck: [19.5, 20],
          hip: [20, 33],
          elbow: [21.5, 11.5],
          hand: [23, 3.5],
          knee: [30, 33],
          ankle: [30.5, 43],
        },
        props: [
          { r: [14, 34, 13, 3, 1] },
          { r: [19, 37, 3, 7] },
          { r: [28, 29.5, 6, 2.4, 1] },
          ...cable([23, -6], [23, 3.5]),
        ],
        front: [{ r: [15, 2.5, 16, 2.2, 1] }],
        arrows: [arrow([38, 4], [38, 22])],
      },
      {
        pose: {
          head: [18, 15],
          neck: [19, 20],
          hip: [20, 33],
          elbow: [16, 27],
          hand: [23, 20.5],
          knee: [30, 33],
          ankle: [30.5, 43],
        },
        props: [
          { r: [14, 34, 13, 3, 1] },
          { r: [19, 37, 3, 7] },
          { r: [28, 29.5, 6, 2.4, 1] },
          ...cable([23, -6], [23, 20.5]),
        ],
        front: [{ r: [15, 19.5, 16, 2.2, 1] }],
        arrows: [arrow([38, 22], [38, 4])],
      },
    ],
  },

  'barbell-row': {
    summary:
      'Bent over at the hips with a flat back, you pull a barbell from below your knees up to your stomach. Builds a thick upper back.',
    steps: [
      'Hold the bar with an overhand grip, hinge forward until your torso is about 30 to 45 degrees from the floor.',
      'Keep your back flat and knees softly bent; the bar hangs below your shoulders.',
      'Pull the bar to your lower ribs, driving your elbows back.',
      'Lower it under control until your arms are straight.',
    ],
    tips: ["Don't stand up as you pull.", 'Squeeze your shoulder blades together at the top.'],
    primary: ['lats', 'upper-back'],
    secondary: ['biceps', 'rear-delts', 'lower-back'],
    frames: [
      {
        pose: {
          head: [34, 13.5],
          neck: [30, 17],
          hip: [16, 24],
          elbow: [30, 24],
          hand: [30, 31],
          knee: [21.5, 33],
          ankle: [20.5, 43],
        },
        front: plate(30, 32.5, 6),
        arrows: [arrow([42, 34], [42, 20])],
      },
      {
        pose: {
          head: [34, 13.5],
          neck: [30, 17],
          hip: [16, 24],
          elbow: [23.5, 19.5],
          hand: [27.5, 25.5],
          knee: [21.5, 33],
          ankle: [20.5, 43],
        },
        front: plate(27.5, 26, 6),
        arrows: [arrow([42, 20], [42, 34])],
      },
    ],
  },

  'cable-row': {
    summary:
      'Seated at a low cable with your feet braced, you pull a handle to your stomach. A back exercise that is easy on the lower back.',
    steps: [
      'Sit with your feet on the platform, knees slightly bent, and grab the handle.',
      'Sit tall with your chest up and arms straight.',
      'Pull the handle to your stomach, driving your elbows back past your body.',
      'Let your arms straighten forward without rounding your back.',
    ],
    tips: ["Don't rock your torso back and forth.", 'Pause with your shoulder blades squeezed.'],
    primary: ['upper-back', 'lats'],
    secondary: ['biceps', 'rear-delts'],
    frames: [
      {
        pose: {
          head: [19, 15],
          neck: [18, 20],
          hip: [15, 32.5],
          elbow: [24.5, 23],
          hand: [31, 25],
          knee: [26, 29],
          ankle: [35, 33],
          toe: [36.5, 29],
        },
        props: [
          { r: [6, 34, 16, 3, 1] },
          { r: [12, 37, 3, 7] },
          { l: [38, 26, 38, 40], w: 3 },
          ...cable([45, 31], [31, 25]),
        ],
        front: [{ r: [30, 23, 3, 4, 1] }],
        arrows: [arrow([30, 12], [16, 12])],
      },
      {
        pose: {
          head: [15, 14.5],
          neck: [15.5, 19.5],
          hip: [15, 32.5],
          elbow: [10, 25],
          hand: [19.5, 26],
          knee: [26, 29],
          ankle: [35, 33],
          toe: [36.5, 29],
        },
        props: [
          { r: [6, 34, 16, 3, 1] },
          { r: [12, 37, 3, 7] },
          { l: [38, 26, 38, 40], w: 3 },
          ...cable([45, 31], [19.5, 26]),
        ],
        front: [{ r: [18.5, 24, 3, 4, 1] }],
        arrows: [arrow([16, 12], [30, 12])],
      },
    ],
  },

  'bicep-curl': {
    summary:
      'Standing with dumbbells, you curl the weights up by bending your elbows. Isolates the biceps.',
    steps: [
      'Stand tall with dumbbells at your sides, palms facing forward.',
      'Pin your elbows to your sides.',
      'Curl the weights up toward your shoulders, squeezing your biceps.',
      'Lower slowly until your arms are straight.',
    ],
    tips: ["Don't swing your body.", 'The lowering half matters as much as the lift.'],
    primary: ['biceps'],
    secondary: ['forearms'],
    frames: [
      {
        pose: { ...STAND, elbow: [25, 19.5], hand: [25.5, 27] },
        front: dumbbell(25.5, 28),
        arrows: curve([31, 30], [37, 25], [34, 16]),
      },
      {
        pose: { ...STAND, elbow: [25, 19.5], hand: [30.5, 13.5] },
        front: dumbbell(31.5, 12.5),
        arrows: curve([37, 15], [39, 24], [32, 30]),
      },
    ],
  },

  'face-pull': {
    summary:
      'At a cable set at face height with a rope, you pull the rope toward your face with elbows high. Strengthens the rear shoulders and upper back.',
    steps: [
      'Set a cable at upper-chest to face height with a rope attachment.',
      'Grip the rope with thumbs toward you and step back so your arms are straight.',
      'Pull the rope toward your face, flaring your elbows out high and pulling the ends apart.',
      'Return slowly to straight arms.',
    ],
    tips: ['Finish with your hands beside your ears.', 'Light weight, strict form.'],
    primary: ['rear-delts', 'upper-back'],
    secondary: ['side-delts'],
    frames: [
      {
        pose: {
          ...STAND,
          head: [23, 7],
          neck: [23, 12],
          hip: [22.5, 25],
          elbow: [30, 11],
          hand: [37, 10],
        },
        props: [{ r: [43, 0, 3, 44, 1] }, ...cable([42, 9], [37, 10])],
        arrows: [arrow([34, 20], [24, 20])],
      },
      {
        pose: {
          ...STAND,
          head: [23, 7],
          neck: [23, 12],
          hip: [22.5, 25],
          elbow: [17, 9],
          hand: [28.5, 6.5],
        },
        props: [{ r: [43, 0, 3, 44, 1] }, ...cable([42, 9], [28.5, 6.5])],
        arrows: [arrow([24, 20], [34, 20])],
      },
    ],
  },

  plank: {
    summary:
      'Hold your body in a straight line on your forearms and toes. Trains the core to resist sagging. A timed hold.',
    steps: [
      'Place your forearms on the floor with elbows under your shoulders.',
      'Step your feet back so your body forms a straight line from head to heels.',
      'Brace your abs and squeeze your glutes.',
      'Hold the position for the target time while breathing steadily.',
    ],
    tips: ["Don't let your hips sag or rise.", 'Keep your neck neutral, eyes on the floor.'],
    primary: ['core'],
    secondary: ['front-delts', 'glutes'],
    frames: [
      {
        pose: {
          head: [36, 32.5],
          neck: [31.5, 35.5],
          hip: [18.5, 38],
          elbow: [31.5, 42],
          hand: [39, 42],
          knee: [11.5, 40],
          ankle: [5, 42],
          toe: [4, 44],
        },
        arrows: [
          { ring: [24, 16, 7], w: 2, tone: 'tide' },
          { l: [24, 16, 24, 11], w: 2, tone: 'tide' },
          { l: [21, 6, 27, 6], w: 2, tone: 'tide' },
        ],
      },
      {
        pose: {
          head: [36, 32.5],
          neck: [31.5, 35.5],
          hip: [18.5, 38],
          elbow: [31.5, 42],
          hand: [39, 42],
          knee: [11.5, 40],
          ankle: [5, 42],
          toe: [4, 44],
        },
        arrows: [
          { ring: [24, 16, 7], w: 2, tone: 'tide' },
          { l: [24, 16, 28.5, 18.5], w: 2, tone: 'tide' },
          { l: [21, 6, 27, 6], w: 2, tone: 'tide' },
        ],
      },
    ],
  },

  'cable-crunch': {
    summary:
      'Kneeling under a high cable with a rope behind your head, you crunch your ribs toward your hips. Loads the abs.',
    steps: [
      'Attach a rope to a high cable and kneel facing the stack.',
      'Hold the rope beside your head and sit your hips back slightly.',
      'Crunch down by curling your ribs toward your pelvis, bringing your elbows toward your thighs.',
      'Return slowly to upright without letting the weight pull you up.',
    ],
    tips: ["Your hips stay still; don't just bow forward.", 'Exhale hard as you crunch.'],
    primary: ['core'],
    secondary: [],
    frames: [
      {
        pose: {
          head: [25.5, 16],
          neck: [23.5, 20.5],
          hip: [21, 33],
          elbow: [28, 22.5],
          hand: [27, 17],
          knee: [22, 43],
          ankle: [12, 43],
          toe: [10, 41],
        },
        props: [{ r: [43, -6, 3, 50, 1] }, ...cable([41, -4], [27, 17])],
        arrows: curve([33, 16], [39, 22], [38, 31]),
      },
      {
        pose: {
          head: [34, 33],
          neck: [30, 30],
          hip: [21, 33],
          elbow: [31, 37],
          hand: [34.5, 30],
          knee: [22, 43],
          ankle: [12, 43],
          toe: [10, 41],
        },
        props: [{ r: [43, -6, 3, 50, 1] }, ...cable([41, -4], [34.5, 30])],
        arrows: curve([40, 33], [42, 24], [36, 18]),
      },
    ],
  },
};

export function guideFor(exerciseId: string | null | undefined): ExerciseGuide | null {
  return exerciseId ? (EXERCISE_GUIDES[exerciseId] ?? null) : null;
}
