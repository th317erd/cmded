"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOOLEAN = void 0;
function BOOLEAN(options) {
    const runner = function ({ formatName, store }, parsedResult) {
        let name = formatName(parsedResult.name);
        let value = (parsedResult.value == null || (/^true|1$/i).test(parsedResult.value));
        if (options && typeof options.validate === 'function') {
            let result = options.validate(value, arguments[0]);
            if (!result)
                return false;
        }
        store({ [name]: value });
        return true;
    };
    runner.parserOptions = { solo: true };
    if (options && options.solo != null)
        runner.parserOptions.solo = !!options.solo;
    return runner;
}
exports.BOOLEAN = BOOLEAN;
BOOLEAN.wrapper = true;
BOOLEAN.parserOptions = { solo: true };