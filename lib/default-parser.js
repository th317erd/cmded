"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultParser = void 0;
function defaultParser(context, options = {}, _index) {
    let doConsume = (options.consume !== false) ? true : false;
    let args = context.args;
    let index = (_index == null) ? args.currentIndex : _index;
    let arg = (doConsume) ? args.consume(index) : args.get(index);
    if (typeof arg !== 'string')
        return;
    let prefix;
    let name;
    let value;
    let notConsumed = (doConsume) ? [] : [index];
    let indexes = [index];
    if (!(options && options.pattern)) {
        return {
            rawName: (options && options.name),
            prefix: undefined,
            name: (options && options.name),
            value: arg,
            notConsumed,
            indexes,
        };
    }
    arg.replace(/^([\W]*)([\w-]+)(?:=(.*))?$/, (m, _prefix, _name, _value) => {
        prefix = _prefix || undefined;
        name = _name;
        value = _value || undefined;
        return m;
    });
    if (prefix && !value && options.solo !== true) {
        arg = (doConsume) ? args.consume(index + 1) : args.get(index + 1);
        if (typeof arg === 'string') {
            if (!doConsume) {
                notConsumed.push(index + 1);
                indexes.push(index + 1);
            }
            else {
                indexes.push(index + 1);
            }
            value = arg;
        }
    }
    return {
        rawName: `${prefix || ''}${name}`,
        prefix,
        name,
        value,
        notConsumed,
        indexes,
    };
}
exports.defaultParser = defaultParser;
