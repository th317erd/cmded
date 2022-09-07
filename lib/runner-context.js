"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunnerContext = void 0;
const nife_1 = __importDefault(require("nife"));
const help_1 = require("./help");
const Types = __importStar(require("./types"));
class RunnerContext {
    constructor(options) {
        this.clone = (options) => {
            return new RunnerContext(Object.assign({ rootOptions: this.rootOptions, context: this.context, args: this.args, runnerPath: this.runnerPath, types: this.options.types }, (options || {})));
        };
        this.fetch = (_scope, defaultValue) => {
            let context = this.context;
            if (_scope == null)
                return context;
            if (nife_1.default.instanceOf(_scope, 'string')) {
                let scope = _scope;
                let value = nife_1.default.get(context, scope);
                if (value === undefined)
                    value = defaultValue;
                return value;
            }
            else {
                let scope = _scope;
                let keys = Object.keys(scope);
                let result = {};
                for (let i = 0, il = keys.length; i < il; i++) {
                    let key = keys[i];
                    let thisDefaultValue = scope[key];
                    let value = nife_1.default.get(context, key);
                    if (value === undefined)
                        value = thisDefaultValue;
                    let keysParts = key
                        .replace(/[\[\]]/g, '.')
                        .replace(/[^\w\d.]/g, '')
                        .replace(/\.+/g, '.')
                        .replace(/^[^\w\d]+/g, '')
                        .replace(/[^\w\d]+$/g, '')
                        .split(/\./g);
                    let sanitizedKey = keysParts[keysParts.length - 1];
                    result[sanitizedKey] = value;
                }
                return result;
            }
        };
        this.store = (_scope, value) => {
            let context = this.context;
            if (nife_1.default.instanceOf(_scope, 'string')) {
                let scope = _scope;
                nife_1.default.set(context, scope, value);
            }
            else {
                let scope = _scope;
                if (!scope)
                    return;
                nife_1.default.extend(true, context, scope);
            }
        };
        this.scope = (name, runner) => {
            let context = this.context;
            let subScope = context[name] = {};
            Object.defineProperties(subScope, {
                '_super': {
                    writable: true,
                    enumerable: false,
                    configurable: true,
                    value: context,
                },
            });
            let subContext = this.clone({
                context: subScope,
            });
            return runner(subContext, {}, {});
        };
        this.parse = (options, index) => {
            let parser = this.rootOptions.parser;
            if (!parser)
                throw new Error('RunnerContext:parse: "parser" not defined, but is required.');
            return parser(this, options, (index == null) ? this.args.currentIndex : index);
        };
        this.formatName = (name) => {
            let formatter = this.rootOptions.formatter;
            if (!formatter)
                throw new Error('RunnerContext:formatName: "formatter" not defined, but is required.');
            return formatter(name, this);
        };
        this.markConsumed = (_indexes) => {
            let indexes = nife_1.default.toArray(_indexes);
            let args = this.args;
            for (let i = 0, il = indexes.length; i < il; i++) {
                let index = indexes[i];
                args.consume(index);
            }
        };
        this.match = (_pattern, runner, options) => {
            let finalResult = false;
            const wrappedRunner = (context, parsedResult) => {
                let runnerPath = this.runnerPath;
                if (parsedResult && parsedResult.name)
                    runnerPath = (runnerPath) ? `${runnerPath}.${parsedResult.name}` : parsedResult.name;
                let newContext = this.clone({
                    runnerPath,
                });
                let _runner = runner;
                if (typeof runner === 'function' && runner.wrapper) {
                    _runner = runner(options);
                }
                let runnerResult = _runner(newContext, parsedResult, options || {});
                if (nife_1.default.instanceOf(runnerResult, 'promise')) {
                    runnerResult.then((result) => {
                        if (result)
                            this.matchCount++;
                    });
                }
                else if (runnerResult) {
                    this.matchCount++;
                }
                return runnerResult;
            };
            this.args.iterate(({ index, stop }) => {
                if (_pattern == null || nife_1.default.instanceOf(_pattern, 'string')) {
                    let pattern = _pattern;
                    if (!pattern && !(options && options.name))
                        throw new Error('RunnerContext::match: "name" option must be supplied if you have specified a "null" pattern.');
                    let parserOptions = Object.assign(Object.assign(Object.assign({}, (runner.parserOptions || {})), (options || {})), { consume: false, pattern });
                    if (!pattern)
                        parserOptions.solo = true;
                    let result = this.parse(parserOptions, index);
                    if (result && (!pattern || (pattern && result.rawName === pattern))) {
                        this.markConsumed(result.notConsumed);
                        result.notConsumed = [];
                        if (options && typeof options.formatParsedResult === 'function') {
                            result = options.formatParsedResult(result, this, options);
                        }
                        finalResult = wrappedRunner(this, result);
                        stop();
                    }
                }
                else if (nife_1.default.instanceOf(_pattern, RegExp)) {
                    let pattern = _pattern;
                    let arg = this.args.get();
                    if (typeof arg === 'string') {
                        let result = arg.match(pattern);
                        if (result) {
                            this.markConsumed(this.args.currentIndex);
                            if (options && typeof options.formatParsedResult === 'function') {
                                result = options.formatParsedResult(result, this, options);
                            }
                            finalResult = wrappedRunner(this, result);
                            stop();
                        }
                    }
                }
                else {
                    let pattern = _pattern;
                    let result = pattern(this, options || {}, index);
                    if (result) {
                        if (options && typeof options.formatParsedResult === 'function') {
                            result = options.formatParsedResult(result, this, options);
                        }
                        finalResult = wrappedRunner(this, result);
                        stop();
                    }
                }
            });
            return finalResult;
        };
        this.showHelp = (_path) => {
            let showHelpFunc = this.rootOptions.showHelp;
            let help = this.rootOptions.help || {};
            let path = (_path != null) ? _path : this.runnerPath;
            let subHelp = (path) ? nife_1.default.get(help, path, help) : help;
            if (showHelpFunc) {
                showHelpFunc(subHelp, help, path, this);
                return;
            }
            if (subHelp)
                (0, help_1.showHelp)(subHelp, help, path, this);
        };
        this.hasMatches = () => {
            return (this.matchCount > 0);
        };
        this.exit = (statusCode) => {
            process.exit(statusCode);
        };
        this.options = options;
        this.matchCount = 0;
    }
    get rootOptions() {
        return this.options.rootOptions;
    }
    get args() {
        return this.options.args;
    }
    get context() {
        return this.options.context;
    }
    get runnerPath() {
        return this.options.runnerPath;
    }
    get Types() {
        return this.options.types || Types;
    }
    get $() {
        return this.match;
    }
}
exports.RunnerContext = RunnerContext;
