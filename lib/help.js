"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showHelp = void 0;
const path_1 = __importDefault(require("path"));
const nife_1 = __importDefault(require("nife"));
function findLongestString(strings) {
    return strings.reduce((len, value) => {
        return (value.length > len) ? value.length : len;
    }, 0);
}
function generateWhitespace(count) {
    let parts = new Array(count);
    for (let i = 0; i < count; i++)
        parts[i] = ' ';
    return parts.join('');
}
function showHelp(help, fullHelp, helpPath, context) {
    let usage = help['@usage'];
    let programName = path_1.default.basename(process.argv[1]);
    let parts = [];
    let helpArgument = context === null || context === void 0 ? void 0 : context.rootOptions.helpArgPattern;
    if (!usage) {
        let path = '';
        if (nife_1.default.isNotEmpty(helpPath))
            path = ('' + helpPath).split(/\./g).join(' ');
        parts.push(`Usage: ${programName} ${(path) ? `${path} ` : ' '}[options]\n`);
    }
    else {
        parts.push(`Usage: ${usage}\n`);
    }
    let title = help['@title'];
    if (title)
        parts.push(`\n${title}\n`);
    parts.push('\nOptions:\n');
    let keys = Object.keys(help).sort();
    let alignmentSpaces = findLongestString(keys.filter((str) => (str.charAt(0) !== '@')));
    if (alignmentSpaces % 2)
        alignmentSpaces++;
    for (let i = 0, il = keys.length; i < il; i++) {
        let key = keys[i];
        if (key.charAt(0) === '@')
            continue;
        let value = help[key];
        if (nife_1.default.instanceOf(value, 'array'))
            throw new TypeError(`showHelp: "${key}": Array doesn't make sense in this context.`);
        let argNames = key.split('|').map((part) => part.trim());
        for (let j = 0, jl = argNames.length; j < jl; j++) {
            let argName = argNames[j];
            parts.push(`  ${argName}:\n`);
        }
        if (nife_1.default.instanceOf(value, 'object')) {
            let subContext = value;
            let title = subContext['@title'];
            let see = subContext['@see'];
            if (!title) {
                let aOrAn = ((/^[aeoui]/i).test(key)) ? 'an' : 'a';
                title = `Invoke ${aOrAn} "${key}" sub-command.`;
            }
            if (!see && helpArgument)
                see = `See: '${programName} ${key} ${helpArgument}' for more help`;
            parts.push(`${('' + title).trim().replace(/^\s*/gm, '    ')}\n    ${see}\n`);
        }
        else {
            parts.push(`${('' + value).trim().replace(/^\s*/gm, '    ')}\n`);
        }
    }
    let examples = nife_1.default.toArray(help['@examples']).filter(Boolean);
    if (nife_1.default.isNotEmpty(examples)) {
        for (let i = 0, il = examples.length; i < il; i++) {
            let example = ('' + examples[i]).replace(/^\s*/gm, '  ');
            parts.push(`\nExample #${i + 1}:\n  ${example.trim()}\n`);
        }
    }
    let notes = nife_1.default.toArray(help['@notes']).filter(Boolean);
    if (nife_1.default.isNotEmpty(notes)) {
        for (let i = 0, il = notes.length; i < il; i++) {
            let note = ('' + notes[i]).replace(/^\s*/gm, '  ');
            parts.push(`\nNote #${i + 1}:\n  ${note.trim()}\n`);
        }
    }
    console.log(`${parts.join('')}`);
}
exports.showHelp = showHelp;
