"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HEX = void 0;
const nife_1 = __importDefault(require("nife"));
function HEX(options) {
    const runner = function ({ formatName, store }, parsedResult, runnerOptions) {
        let name = formatName(runnerOptions.name || parsedResult.name);
        if (!(/^[+-]?0x[0-9A-F]+$/i).test(parsedResult.value))
            return false;
        let value = parseInt(parsedResult.value, 16);
        if (!isFinite(value))
            return false;
        let validate = nife_1.default.get(runnerOptions, 'validate', nife_1.default.get(options, 'validate'));
        if (typeof validate === 'function') {
            let result = validate(value, arguments[0]);
            if (!result)
                return false;
        }
        let format = nife_1.default.get(runnerOptions, 'format', nife_1.default.get(options, 'format'));
        if (typeof format === 'function')
            value = format(value);
        store({ [name]: value });
        return true;
    };
    if (options && options.solo != null)
        runner.parserOptions = { solo: !!options.solo };
    return runner;
}
exports.HEX = HEX;
HEX.wrapper = true;
