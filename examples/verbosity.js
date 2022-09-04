const { CMDed } = require('../');

const help = {
  '@examples': [
    'verbosity -v',
    'verbosity -v -v -v',
    'verbosity -v -v -v -v -v',
  ],
  '-v': 'Specify multiple times to increase verbosity',
};

const WORDS = [
  'super',
  'uber',
  'duper',
  'crazy',
  'insanely',
  'incredibly',
];

let args = CMDed(({ $, hasMatches }) => {
  // Collect all verbosity flags
  while (
    // Define a "matcher"
    $(
      // Argument pattern to match on
      '-v',
      // Runner when a match is found
      ({ fetch, store }) => {
        // Fetch "verbosity" with a default of "0"
        // if not found.
        let { verbosity } = fetch({ verbosity: 0 });

        // Store verbosity back +1
        store({ verbosity: verbosity + 1 });

        // Success
        return true;
      },
      {
        // The "solo" option tells CMDed
        // that this is a "single argument".
        // This means we will only consume
        // "-v", instead of trying to consume
        // "-v {x}" (two arguments).
        solo: true,
      },
    )
  ) { };

  // If no matches, then "showHelp" will be called
  return hasMatches();
}, { help });

if (!args) {
  process.exit(1);
}

// Generate some random funny phrase for our verbosity level
function generateVerbosityLevel(level) {
  let parts = [];
  for (let i = 0; i < level; i++) {
    let index = Math.floor(Math.random() * WORDS.length);
    parts.push(WORDS[ index ]);
  }

  return parts.join(' ');
}

console.log(`I am going to be ${generateVerbosityLevel(args.verbosity)} verbose!`);
