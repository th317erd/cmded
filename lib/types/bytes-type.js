"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BYTES = void 0;
const KILOBYTES = 1024;
const MEGABYTES = KILOBYTES * 1024;
const GIGABYTES = MEGABYTES * 1024;
const TERABYTES = GIGABYTES * 1024;
const SCALAR_MAP = {
    'b': 1,
    'k': KILOBYTES,
    'm': MEGABYTES,
    'g': GIGABYTES,
    't': TERABYTES,
};
function BYTES(options) {
    const runner = function ({ formatName, store }, parsedResult) {
        let name = formatName(parsedResult.name);
        if (!(/^\+?[\d.]+(b|k|kb|m|mb|g|gb|t|tb)?$/i).test(parsedResult.value))
            return false;
        let size = '';
        let scalar = 'b';
        parsedResult.value.replace(/^\+?([\d.]+)(b|k|m|g|t)?/i, (m, _size, _scalar) => {
            size = _size;
            scalar = (_scalar || 'b').toLowerCase();
            return m;
        });
        if (!size)
            return false;
        let value = parseFloat(size);
        if (!isFinite(value))
            return false;
        let scalarN = SCALAR_MAP[scalar] || 1;
        value = Math.round(value * scalarN);
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
exports.BYTES = BYTES;
BYTES.wrapper = true;
