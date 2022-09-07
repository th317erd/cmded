#!/usr/bin/env node

const { CMDed, Types, showHelp } = require('../');
const { spawn } = require('child_process');

// Define our help for this command
const help = {
  '@usage': 'my-echo [options] ...arg1 ...arg2 ...argN',
  '@title': 'Echo arguments back to caller',
  '@examples': [
    './my-echo hello world',
    './my-echo --duplicate hello world',
    './my-echo hello world --use-system-echo --duplicate',
  ],
  '--use-system-echo': 'Spawn system "echo", handing off arguments to the child process',
  '--duplicate': 'Duplicate all provided arguments',
};

// Parse our arguments.
// All remaining arguments will be placed into `args._remaining`.
let args = CMDed(({ $, store }) => {
  // Runners should always return `true` if they succeed,
  // so the `|| store(...)` syntax is one way for us to
  // set "default values" for each of our options.
  $('--use-system-echo', Types.BOOLEAN()) || store({ 'useSystemEcho': false });
  $('--duplicate', Types.BOOLEAN()) || store({ 'duplicate': false });

  // This informs CMDed that everything went okay.
  // If a "runner" ever returns `false`, then CMDed
  // will know that the runner has failed... this isn't
  // always a bad thing, but it generally means that it
  // is time to show the help. In this case however,
  // both our arguments are optional, so if they weren't
  // parsed, then that is okay.
  return true;
}, { help });

// If no arguments were provided, then show the help
let remainingArgs = args._remaining;
if (remainingArgs.length === 0) {
  showHelp(help);
  process.exit(1);
}

// Duplicate args if requested
if (args.duplicate)
  remainingArgs = Array.prototype.concat.apply([], remainingArgs.map((arg) => [ arg, arg ]));

// Now let's echo
if (args.useSystemEcho) {
  spawn('echo', remainingArgs, { stdio: 'inherit' });
} else {
  console.log(remainingArgs.join(' '));
}
