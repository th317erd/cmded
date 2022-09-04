"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HEX = void 0;
function HEX(options) {
    const runner = function ({ formatName, store }, parsedResult) {
        let name = formatName(parsedResult.name);
        if (!(/^[+-]?0x[0-9A-F]+$/i).test(parsedResult.value))
            return false;
        let value = parseInt(parsedResult.value, 16);
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
exports.HEX = HEX;
HEX.wrapper = true;
