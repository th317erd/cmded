"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OCTAL = void 0;
function OCTAL(options) {
    const runner = function ({ formatName, store }, parsedResult) {
        let name = formatName(parsedResult.name);
        if (!(/^[+-]?0o[0-7]+$/i).test(parsedResult.value))
            return false;
        let value = parseInt(parsedResult.value, 8);
        if (!isFinite(value))
            return false;
        if (options && typeof options.validate === 'function') {
            let result = options.validate(value, arguments[0]);
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
