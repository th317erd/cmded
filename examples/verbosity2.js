const { CMDed } = require('../lib');

const help = {
  '@examples': [
    'verbosity2 -v',
    'verbosity2 -v -v -v --word stupid --word=obnoxiously',
    'verbosity2 -v -v -v -v -v --word \'too much\' --word overly',
  ],
  '-v': 'Verbosity level. Specify multiple times to increase verbosity.',
  '--word {word} | --word=word': 'Add an extra word to use for the verbosity level.',
};

const WORDS = [
  'super',
  'uber',
  'duper',
  'crazy',
  'insanely',
  'incredibly',
];

// Create our own runner, which
// could be exported and reimported.
function INCREASING_LEVEL({ fetch, store }) {
  // Fetch "verbosity" with a default of "0"
  // if not found.
  let { verbosity } = fetch({ verbosity: 0 });

  // Store verbosity back +1
  store({ verbosity: verbosity + 1 });

  // Success
  return true;
}

// Set this runner to pass arguments to the parser
// any time it is used.
//
// The "solo" option tells CMDed
// that this is a "single argument".
// This means we will only consume
// "-v", instead of trying to consume
// "-v {x}" (two arguments).
INCREASING_LEVEL.parserOptions = { solo: true };

// Capture extra words specified
function WORD({ fetch, store }, { value }) {
  // Did something go wrong with parsing?
  if (!value)
    return false;

  // Fetch "words" with a default of "[]"
  // if not found.
  let { words } = fetch({ words: [] });

  // Store words back via concat
  store({ words: words.concat(value) });

  // Success
  return true;
}

let args = CMDed(({ $, hasMatches }) => {
  // Collect all verbosity flags
  while (
    // Define a "matcher"
    $(
      // Argument pattern to match on
      '-v',
      // Runner when a match is found
      INCREASING_LEVEL,
    )
  ) { };

  while ($('--word', WORD)) { };

  // If no matches, then "showHelp" will be called
  return hasMatches();
}, { help });

if (!args) {
  process.exit(1);
}

// Generate some random funny phrase for our verbosity level
function generateVerbosityLevel(level, extraWords) {
  let parts = [];
  let allWords = WORDS.concat(extraWords || []);

  for (let i = 0; i < level; i++) {
    let index = Math.floor(Math.random() * allWords.length);
    parts.push(allWords[ index ]);
  }

  return parts.join(' ');
}

console.log(`I am going to be ${generateVerbosityLevel(args.verbosity, args.words)} verbose!`);
