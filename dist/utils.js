"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renameVariables = exports.renameVariablesAndTopLevelFields = exports.renameVariablesAndTopLevelFieldsOnOpDef = exports.renameSelectionSetArguments = exports.renameVariableDefinition = exports.renameDirectiveArguments = exports.renameArgument = exports.renameValue = exports.defaultRenameFn = void 0;
var defaultRenameFn = function (name, index) { return "".concat(name, "_").concat(index); };
exports.defaultRenameFn = defaultRenameFn;
function renameValue(node, renameFn) {
    if (node.kind === 'Variable') {
        return __assign(__assign({}, node), { name: __assign(__assign({}, node.name), { value: renameFn(node.name.value) }) });
    }
    else if (node.kind === 'ObjectValue') {
        return __assign(__assign({}, node), { fields: node.fields.map(function (field) { return (__assign(__assign({}, field), { value: renameValue(field.value, renameFn) })); }) });
    }
    else if (node.kind === 'ListValue') {
        return __assign(__assign({}, node), { values: node.values.map(function (value) { return renameValue(value, renameFn); }) });
    }
    return node;
}
exports.renameValue = renameValue;
function renameArgument(node, renameFn) {
    return __assign(__assign({}, node), { value: renameValue(node.value, renameFn) });
}
exports.renameArgument = renameArgument;
function renameDirectiveArguments(node, renameFn) {
    var _a;
    return __assign(__assign({}, node), { arguments: (_a = node.arguments) === null || _a === void 0 ? void 0 : _a.map(function (arg) { return renameArgument(arg, renameFn); }) });
}
exports.renameDirectiveArguments = renameDirectiveArguments;
function renameVariableDefinition(node, renameFn) {
    var _a;
    return __assign(__assign({}, node), { variable: __assign(__assign({}, node.variable), { name: __assign(__assign({}, node.variable.name), { value: renameFn(node.variable.name.value) }) }), directives: (_a = node.directives) === null || _a === void 0 ? void 0 : _a.map(function (dir) { return renameDirectiveArguments(dir, renameFn); }) });
}
exports.renameVariableDefinition = renameVariableDefinition;
function renameSelectionSetArguments(selectionSet, renameFn) {
    return __assign(__assign({}, selectionSet), { selections: selectionSet.selections.map(function (sel) {
            var _a, _b, _c;
            switch (sel.kind) {
                case 'Field':
                    return __assign(__assign({}, sel), { arguments: (_a = sel.arguments) === null || _a === void 0 ? void 0 : _a.map(function (arg) { return renameArgument(arg, renameFn); }), selectionSet: sel.selectionSet ? renameSelectionSetArguments(sel.selectionSet, renameFn) : undefined });
                case 'FragmentSpread':
                    return __assign(__assign({}, sel), { directives: (_b = sel.directives) === null || _b === void 0 ? void 0 : _b.map(function (dir) { return renameDirectiveArguments(dir, renameFn); }) });
                case 'InlineFragment':
                    return __assign(__assign({}, sel), { directives: (_c = sel.directives) === null || _c === void 0 ? void 0 : _c.map(function (dir) { return renameDirectiveArguments(dir, renameFn); }), selectionSet: renameSelectionSetArguments(sel.selectionSet, renameFn) });
            }
        }) });
}
exports.renameSelectionSetArguments = renameSelectionSetArguments;
function renameVariablesAndTopLevelFieldsOnOpDef(op, variableRenameFn, fieldRenameFn) {
    var _a, _b;
    return __assign(__assign({}, op), { variableDefinitions: (_a = op.variableDefinitions) === null || _a === void 0 ? void 0 : _a.map(function (vardef) { return renameVariableDefinition(vardef, variableRenameFn); }), directives: (_b = op.directives) === null || _b === void 0 ? void 0 : _b.map(function (dir) { return renameDirectiveArguments(dir, variableRenameFn); }), selectionSet: renameSelectionSetArguments(__assign(__assign({}, op.selectionSet), { selections: op.selectionSet.selections.map(function (sel) {
                var _a, _b;
                switch (sel.kind) {
                    case 'Field':
                        return __assign(__assign({}, sel), { alias: __assign(__assign({}, sel.name), { value: fieldRenameFn((_b = (_a = sel.alias) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : sel.name.value) }) });
                    default:
                        return sel;
                }
            }) }), variableRenameFn) });
}
exports.renameVariablesAndTopLevelFieldsOnOpDef = renameVariablesAndTopLevelFieldsOnOpDef;
function renameVariablesAndTopLevelFields(doc, variableRenameFn, fieldRenameFn) {
    return __assign(__assign({}, doc), { definitions: __spreadArray(__spreadArray([], doc.definitions.filter(function (def) { return def.kind !== 'OperationDefinition'; }), true), doc.definitions.filter(function (def) { return def.kind === 'OperationDefinition'; }).map(function (opDef) {
            return renameVariablesAndTopLevelFieldsOnOpDef(opDef, variableRenameFn, fieldRenameFn);
        }), true) });
}
exports.renameVariablesAndTopLevelFields = renameVariablesAndTopLevelFields;
function renameVariables(variables, renameFn) {
    return Object.keys(variables).reduce(function (vars, key) {
        var _a;
        return __assign(__assign({}, vars), (_a = {}, _a[renameFn(key)] = variables[key], _a));
    }, {});
}
exports.renameVariables = renameVariables;
//# sourceMappingURL=utils.js.map