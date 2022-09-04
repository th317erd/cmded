# cmded

CMDed is a command line argument parser made for humans

Rules:
  1. Captures will consume (and mark as consumed) the arguments they use
  2. Runners will return `true` if they match at least once, or `false` if they don't
  3. Runners can be asynchronous, but they must always return `true` or `false`

scope(name, runner) = Start a new subscope
fetch({ 'parent.context': 0, 'something': true }) = fetch multiple keys
fetch('parent.context', 0) = fetch a solo key
store({ something: true, derpy: 'world' }) = store multiple keys on current context
store('something', true) = store solo key on current context

```javascript
import Path from 'node:path';
import FileSystem from 'node:fs/promise';
import { CMDed, ShowHelp, Types } from 'cmded';

CMDed(({ $ }) => {
  scope('subContext', () => {
    $(() => {

    })
  });

  $(
    '--help',
    ShowHelp,
    "Show this help",
  ); // Direct match

  $('-h',     '--help'); // Alias

  $('-v',     ({ fetch, store }) => { // Runner
    let { verbosity } = fetch({ verbosity: 0 });
    store({ verbosity: verbosity + 1 });
  });

  $('required', ({ $, store }) => {
    $('--subArg', Types.Boolean) || store({ subArg: true });
  }) || ShowHelp;
}, {
  strict: true,
  argv:   process.argv.slice(2),
  parser: (arg) => {

  },
});
```
