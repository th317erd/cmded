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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Types = exports.CMDed = void 0;
const nife_1 = __importDefault(require("nife"));
const runner_context_1 = require("./runner-context");
const arguments_1 = require("./arguments");
const default_parser_1 = require("./default-parser");
const default_formatter_1 = require("./default-formatter");
const Types = __importStar(require("./types"));
function CMDed(entryMethod, _options) {
    let rootOptions = Object.assign({ strict: false, argv: process.argv.slice(2), parser: default_parser_1.defaultParser, formatter: default_formatter_1.defaultFormatter, helpArgPattern: '--help' }, (_options || {}));
    rootOptions.types = Object.assign(Object.assign({}, Types), (rootOptions.types || {}));
    let context = {};
    let runnerContext = new runner_context_1.RunnerContext({
        rootOptions,
        context,
        args: new arguments_1.Arguments(rootOptions.argv || []),
        runnerPath: '',
        types: rootOptions.types,
    });
    Object.defineProperties(context, {
        '_runnerContext': {
            writable: true,
            enumerable: false,
            configurable: true,
            value: runnerContext,
        },
    });
    const finalizeResult = (result, resolve, reject) => {
        if (!result) {
            runnerContext.showHelp();
            if (typeof resolve === 'function')
                resolve(undefined);
            return;
        }
        else {
            let unconsumed = runnerContext.args.getUnconsumedIndexes();
            if (rootOptions.strict && unconsumed.length > 0) {
                runnerContext.showHelp();
                if (typeof resolve === 'function')
                    resolve(undefined);
                return;
            }
            let remaining = unconsumed.map((index) => runnerContext.args.get(index));
            if (!Object.prototype.hasOwnProperty.call(runnerContext.context, '_remaining')) {
                Object.defineProperties(runnerContext.context, {
                    '_remaining': {
                        writable: true,
                        enumerable: false,
                        configurable: true,
                        value: remaining,
                    },
                });
            }
            let finalContext = runnerContext.fetch();
            if (typeof resolve === 'function')
                resolve(finalContext);
            return finalContext;
        }
    };
    if (rootOptions.helpArgPattern && rootOptions.help) {
        let result = runnerContext.match(rootOptions.helpArgPattern, () => {
            let unconsumedArgs = runnerContext.args.getUnconsumed();
            if (nife_1.default.isEmpty(unconsumedArgs))
                runnerContext.showHelp('');
            else
                runnerContext.showHelp(unconsumedArgs.join('.'));
            return true;
        }, { solo: true });
        if (result)
            return;
    }
    let result = entryMethod(runnerContext, {}, {});
    if (nife_1.default.instanceOf(result, 'promise')) {
        let promise = result;
        return new Promise((resolve, reject) => {
            promise.then((result) => {
                finalizeResult(result, resolve, reject);
            }, (error) => {
                reject(error);
            });
        });
    }
    return finalizeResult(result);
}
exports.CMDed = CMDed;
exports.Types = __importStar(require("./types"));
__exportStar(require("./arguments"), exports);
__exportStar(require("./common"), exports);
__exportStar(require("./default-formatter"), exports);
__exportStar(require("./default-parser"), exports);
__exportStar(require("./help"), exports);
__exportStar(require("./root-options"), exports);
__exportStar(require("./runner-context"), exports);
