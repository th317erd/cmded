"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OCTAL = void 0;
const nife_1 = __importDefault(require("nife"));
function OCTAL(options) {
    const runner = function ({ formatName, store }, parsedResult, runnerOptions) {
        let name = formatName(runnerOptions.name || parsedResult.name);
        if (!(/^[+-]?(0o)?[0-7]+$/i).test(parsedResult.value))
            return false;
        let value = parseInt(parsedResult.value.replace(/^([+-]?)(0o)?/, '$1'), 8);
        if (!isFinite(value))
            return false;
        let validate = nife_1.default.get(runnerOptions, 'validate', nife_1.default.get(options, 'validate'));
        if (typeof validate === 'function') {
            let result = validate(value, arguments[0]);
            if (!result)
                return false;
        }
        store({ [name]: value });
        return true;
    };
    if (options && options.solo != null)
        runner.parserOptions = { solo: !!options.solo };
    return runner;
}
exports.OCTAL = OCTAL;
OCTAL.wrapper = true;
