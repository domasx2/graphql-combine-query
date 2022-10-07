"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
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
var renameFn = function (id) { return function (varName) {
    return "".concat(id, "_").concat(varName);
}; };
var prefixInput = function (id, document, variables) {
    return {
        document: (0, utils_1.renameVariablesAndTopLevelFields)(document, renameFn(id), function (fieldName) { return fieldName; }),
        variables: variables && (0, utils_1.renameVariables)(variables, renameFn(id))
    };
};
var CombinedQueryBuilderImpl = /** @class */ (function () {
    function CombinedQueryBuilderImpl(operationName, id, document, variables) {
        this.operationName = operationName;
        this.id = id;
        this.document = document;
        this.variables = variables;
    }
    CombinedQueryBuilderImpl.prototype.add = function (id, document, variables) {
        var _this = this;
        var _a = prefixInput(id, document, variables), updatedDocument = _a.document, updatedVariables = _a.variables;
        var opDefs = this.document.definitions.concat(updatedDocument.definitions).filter(function (def) { return def.kind === 'OperationDefinition'; });
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
                    throw new CombinedQueryError("expected all operations to be of the same type, but ".concat((_a = _def.name) === null || _a === void 0 ? void 0 : _a.value, " is ").concat(_def.operation, " and ").concat((_b = def.name) === null || _b === void 0 ? void 0 : _b.value, " is ").concat(def.operation));
                }
            });
            // all top level fields mut be unique. doesn't drill down fragments tho. maybe someday
            (_a = def.selectionSet.selections) === null || _a === void 0 ? void 0 : _a.filter(function (s) { return s.kind === 'Field'; }).forEach(function (sel) {
                otherOpDefs.forEach(function (_def) {
                    var _a;
                    return (_a = _def.selectionSet.selections) === null || _a === void 0 ? void 0 : _a.filter(function (s) { return s.kind === 'Field'; }).forEach(function (_sel) {
                        var _a, _b, _c, _d;
                        if ((((_a = sel.alias) === null || _a === void 0 ? void 0 : _a.value) || sel.name.value) === (((_b = _sel.alias) === null || _b === void 0 ? void 0 : _b.value) || _sel.name.value)) {
                            throw new CombinedQueryError("duplicate field definition ".concat(_sel.name.value, " for operations ").concat((_c = def.name) === null || _c === void 0 ? void 0 : _c.value, " and ").concat((_d = _def.name) === null || _d === void 0 ? void 0 : _d.value));
                        }
                    });
                });
            });
            // finally all variables must be unique
            (_b = def.variableDefinitions) === null || _b === void 0 ? void 0 : _b.forEach(function (variable) {
                otherOpDefs.forEach(function (_def) {
                    var _a;
                    return (_a = _def.variableDefinitions) === null || _a === void 0 ? void 0 : _a.forEach(function (_variable) {
                        var _a, _b;
                        if (variable.variable.name.value === _variable.variable.name.value) {
                            throw new CombinedQueryError("duplicate variable definition ".concat(_variable.variable.name.value, " for operations ").concat((_a = def.name) === null || _a === void 0 ? void 0 : _a.value, " and ").concat((_b = _def.name) === null || _b === void 0 ? void 0 : _b.value));
                        }
                    });
                });
            });
        });
        var newVars = (function () {
            if (_this.variables && updatedVariables) {
                return __assign(__assign({}, _this.variables), updatedVariables);
            }
            return (updatedVariables || _this.variables);
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
        var combinedDocumentDefinitions = this.document.definitions.concat(updatedDocument.definitions);
        for (var _i = 0, combinedDocumentDefinitions_1 = combinedDocumentDefinitions; _i < combinedDocumentDefinitions_1.length; _i++) {
            var definition = combinedDocumentDefinitions_1[_i];
            if (definition.kind === 'OperationDefinition') {
                continue;
            }
            if (definition.kind === 'FragmentDefinition') {
                if (encounteredFragmentList.has(definition.name.value)) {
                    continue;
                }
                encounteredFragmentList.add(definition.name.value);
            }
            definitions = __spreadArray([definition], definitions, true);
        }
        var newDoc = {
            kind: 'Document',
            definitions: definitions
        };
        return new CombinedQueryBuilderImpl(this.operationName, id, newDoc, newVars);
    };
    CombinedQueryBuilderImpl.prototype.addN = function (id, document, variables, variableRenameFn, fieldRenameFn) {
        if (variableRenameFn === void 0) { variableRenameFn = utils_1.defaultRenameFn; }
        if (fieldRenameFn === void 0) { fieldRenameFn = utils_1.defaultRenameFn; }
        if (!variables.length) {
            return this;
        }
        return variables.reduce(function (builder, _variables, idx) {
            var doc = (0, utils_1.renameVariablesAndTopLevelFields)(document, function (name) { return variableRenameFn(name, idx); }, function (name) { return fieldRenameFn(name, idx); });
            var vars = (0, utils_1.renameVariables)(_variables, function (name) { return variableRenameFn(name, idx); });
            return builder.add(id, doc, vars);
        }, this);
    };
    return CombinedQueryBuilderImpl;
}());
function combinedQuery(operationName) {
    return {
        operationName: operationName,
        add: function (id, document, variables) {
            var _a = prefixInput(id, document, variables), prefixedDoc = _a.document, prefixVars = _a.variables;
            return new CombinedQueryBuilderImpl(this.operationName, id, prefixedDoc, prefixVars);
        },
        addN: function (id, document, variables, variableRenameFn, fieldRenameFn) {
            return new CombinedQueryBuilderImpl(this.operationName, id, emptyDoc).addN(id, document, variables, variableRenameFn, fieldRenameFn);
        }
    };
}
exports.default = combinedQuery;
//# sourceMappingURL=index.js.map