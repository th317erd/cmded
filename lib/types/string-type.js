"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.STRING = void 0;
const nife_1 = __importDefault(require("nife"));
function STRING(options) {
    const runner = function ({ formatName, store }, parsedResult, runnerOptions) {
        let name = formatName(runnerOptions.name || parsedResult.name);
        let value = parsedResult.value;
        if (value == null)
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
exports.STRING = STRING;
STRING.wrapper = true;
