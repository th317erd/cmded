"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DECIMAL = void 0;
function DECIMAL(options) {
    const runner = function ({ formatName, store }, parsedResult) {
        let name = formatName(parsedResult.name);
        if (!(/^[+-]?(\d*.\d+|\d+.\d*)(e[+-]?\d+)?$/).test(parsedResult.value))
            return false;
        let value = parseFloat(parsedResult.value);
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
exports.DECIMAL = DECIMAL;
DECIMAL.wrapper = true;
