import { DocumentNode } from 'graphql';
import { RenameFnWithIndex } from './utils';
declare type OperationVariables = Record<string, any>;
export interface NewCombinedQueryBuilder {
    operationName: string;
    add: <TData = any, TVariables = OperationVariables>(document: DocumentNode, variables?: TVariables) => CombinedQueryBuilder<TData, TVariables>;
    addN: <TVariables = OperationVariables>(document: DocumentNode, variables: TVariables[], variableRenameFn?: RenameFnWithIndex, fieldRenameFn?: RenameFnWithIndex) => CombinedQueryBuilder<{}, {}>;
}
export interface CombinedQueryBuilder<TData = any, TVariables extends OperationVariables = {}> {
    document: DocumentNode;
    variables?: TVariables;
    add: <TDataAdd = any, TVariablesAdd = OperationVariables>(document: DocumentNode, variables?: TVariablesAdd) => CombinedQueryBuilder<TData & TDataAdd, TVariables & TVariablesAdd>;
    addN: <TVariablesAdd = OperationVariables>(document: DocumentNode, variables: TVariablesAdd[], variableRenameFn?: RenameFnWithIndex, fieldRenameFn?: RenameFnWithIndex) => CombinedQueryBuilder<TData, TVariables>;
}
export default function combinedQuery(operationName: string): NewCombinedQueryBuilder;
export {};
//# sourceMappingURL=index.d.ts.map