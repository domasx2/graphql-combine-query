import { SelectionSetNode } from 'graphql';
import { ArgumentNode, DirectiveNode, OperationDefinitionNode, VariableDefinitionNode, DocumentNode, ValueNode } from 'graphql/language';
export declare type RenameFn = (name: string) => string;
export declare type RenameFnWithIndex = (name: string, index: number) => string;
export declare const defaultRenameFn: RenameFnWithIndex;
export declare function renameValue(node: ValueNode, renameFn: RenameFn): ValueNode;
export declare function renameArgument(node: ArgumentNode, renameFn: RenameFn): ArgumentNode;
export declare function renameDirectiveArguments(node: DirectiveNode, renameFn: RenameFn): DirectiveNode;
export declare function renameVariableDefinition(node: VariableDefinitionNode, renameFn: RenameFn): VariableDefinitionNode;
export declare function renameSelectionSetArguments(selectionSet: SelectionSetNode, renameFn: (name: string) => string): SelectionSetNode;
export declare function renameVariablesAndTopLevelFieldsOnOpDef(op: OperationDefinitionNode, variableRenameFn: RenameFn, fieldRenameFn: RenameFn): OperationDefinitionNode;
export declare function renameVariablesAndTopLevelFields(doc: DocumentNode, variableRenameFn: RenameFn, fieldRenameFn: RenameFn): DocumentNode;
export declare function renameVariables(variables: Record<string, any>, renameFn: RenameFn): Record<string, any>;
//# sourceMappingURL=utils.d.ts.map