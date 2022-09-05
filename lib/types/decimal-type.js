"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DECIMAL = void 0;
const nife_1 = __importDefault(require("nife"));
function DECIMAL(options) {
    const runner = function ({ formatName, store }, parsedResult, runnerOptions) {
        let name = formatName(parsedResult.name);
        if (!(/^[+-]?(\d*.\d+|\d+.\d*)(e[+-]?\d+)?$/).test(parsedResult.value))
            return false;
        let value = parseFloat(parsedResult.value);
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
exports.DECIMAL = DECIMAL;
DECIMAL.wrapper = true;
