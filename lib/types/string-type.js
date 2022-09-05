"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.STRING = void 0;
const nife_1 = __importDefault(require("nife"));
function STRING(options) {
    const runner = function ({ formatName, store }, parsedResult, runnerOptions) {
        let name = formatName(parsedResult.name);
        let value = parsedResult.value;
        if (value == null)
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
exports.STRING = STRING;
STRING.wrapper = true;
