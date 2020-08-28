"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var emptyDoc = {
    kind: 'Document',
    definitions: []
};
var CombinedQueryError = /** @class */ (function (_super) {
    __extends(CombinedQueryError, _super);
    function CombinedQueryError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return CombinedQueryError;
}(Error));
var CombinedQueryBuilderImpl = /** @class */ (function () {
    function CombinedQueryBuilderImpl(operationName, document, variables) {
        this.operationName = operationName;
        this.document = document;
        this.variables = variables;
    }
    CombinedQueryBuilderImpl.prototype.add = function (document, variables) {
        var _this = this;
        var opDefs = this.document.definitions.concat(document.definitions).filter(function (def) { return def.kind === 'OperationDefinition'; });
        if (!opDefs.length) {
            throw new CombinedQueryError('Expected at least one OperationDefinition, but found none.');
        }
        // do some basic validation
        opDefs.forEach(function (def) {
            var _a, _b;
            var otherOpDefs = opDefs.filter(function (_def) { return _def !== def; });
            // all op defs must be of the same type
            otherOpDefs.forEach(function (_def) {
                var _a, _b;
                if (_def.operation !== def.operation) {
                    throw new CombinedQueryError("expected all operations to be of the smae type, but " + ((_a = _def.name) === null || _a === void 0 ? void 0 : _a.value) + " is " + _def.operation + " and " + ((_b = def.name) === null || _b === void 0 ? void 0 : _b.value) + " is " + def.operation);
                }
            });
            // all top level fields mut be unique. doesn't drill down framgents tho. maybe someday
            (_a = def.selectionSet.selections) === null || _a === void 0 ? void 0 : _a.filter(function (s) { return s.kind === 'Field'; }).forEach(function (sel) {
                otherOpDefs.forEach(function (_def) { var _a; return (_a = _def.selectionSet.selections) === null || _a === void 0 ? void 0 : _a.filter(function (s) { return s.kind === 'Field'; }).forEach(function (_sel) {
                    var _a, _b, _c, _d;
                    if ((((_a = sel.alias) === null || _a === void 0 ? void 0 : _a.value) || sel.name.value) === (((_b = _sel.alias) === null || _b === void 0 ? void 0 : _b.value) || _sel.name.value)) {
                        throw new CombinedQueryError("duplicate field definition " + _sel.name.value + " for oprations " + ((_c = def.name) === null || _c === void 0 ? void 0 : _c.value) + " and " + ((_d = _def.name) === null || _d === void 0 ? void 0 : _d.value));
                    }
                }); });
            });
            // finally all variables must be unique
            (_b = def.variableDefinitions) === null || _b === void 0 ? void 0 : _b.forEach(function (variable) {
                otherOpDefs.forEach(function (_def) { var _a; return (_a = _def.variableDefinitions) === null || _a === void 0 ? void 0 : _a.forEach(function (_variable) {
                    var _a, _b;
                    if (variable.variable.name.value === _variable.variable.name.value) {
                        throw new CombinedQueryError("duplicate variable definition " + _variable.variable.name.value + " for oprations " + ((_a = def.name) === null || _a === void 0 ? void 0 : _a.value) + " and " + ((_b = _def.name) === null || _b === void 0 ? void 0 : _b.value));
                    }
                }); });
            });
        });
        var newVars = (function () {
            if (_this.variables && variables) {
                return __assign(__assign({}, _this.variables), variables);
            }
            return (variables || _this.variables);
        })();
        var definitions = [{
                kind: 'OperationDefinition',
                directives: opDefs.flatMap(function (def) { return def.directives || []; }),
                name: { kind: 'Name', value: this.operationName },
                operation: opDefs[0].operation,
                selectionSet: {
                    kind: 'SelectionSet',
                    selections: opDefs.flatMap(function (def) { return def.selectionSet.selections; })
                },
                variableDefinitions: opDefs.flatMap(function (def) { return def.variableDefinitions || []; })
            }];
        var encounteredFragmentList = new Set();
        for (var _i = 0, _a = document.definitions; _i < _a.length; _i++) {
            var definition = _a[_i];
            if (definition.kind === 'OperationDefinition') {
                continue;
            }
            if (definition.kind === 'FragmentDefinition') {
                if (encounteredFragmentList.has(definition.name.value)) {
                    continue;
                }
                encounteredFragmentList.add(definition.name.value);
            }
            definitions = __spreadArrays([definition], definitions);
        }
        var newDoc = {
            kind: 'Document',
            definitions: definitions
        };
        return new CombinedQueryBuilderImpl(this.operationName, newDoc, newVars);
    };
    CombinedQueryBuilderImpl.prototype.addN = function (document, variables, variableRenameFn, fieldRenameFn) {
        if (variableRenameFn === void 0) { variableRenameFn = utils_1.defaultRenameFn; }
        if (fieldRenameFn === void 0) { fieldRenameFn = utils_1.defaultRenameFn; }
        if (!variables.length) {
            return this;
        }
        return variables.reduce(function (builder, _variables, idx) {
            var doc = utils_1.renameVariablesAndTopLevelFields(document, function (name) { return variableRenameFn(name, idx); }, function (name) { return fieldRenameFn(name, idx); });
            var vars = utils_1.renameVariables(_variables, function (name) { return variableRenameFn(name, idx); });
            return builder.add(doc, vars);
        }, this);
    };
    return CombinedQueryBuilderImpl;
}());
function combinedQuery(operationName) {
    return {
        operationName: operationName,
        add: function (document, variables) {
            return new CombinedQueryBuilderImpl(this.operationName, document, variables);
        },
        addN: function (document, variables) {
            return new CombinedQueryBuilderImpl(this.operationName, emptyDoc).addN(document, variables);
        }
    };
}
exports.default = combinedQuery;
//# sourceMappingURL=index.js.map