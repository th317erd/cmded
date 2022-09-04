"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultFormatter = void 0;
const nife_1 = __importDefault(require("nife"));
function defaultFormatter(name, context) {
    return nife_1.default.snakeCaseToCamelCase(name.replace(/\W+/g, '_'));
}
exports.defaultFormatter = defaultFormatter;
