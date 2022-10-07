import { DocumentNode } from 'graphql';
import { RenameFnWithIndex } from './utils';
declare type OperationVariables = Record<string, any>;
export interface NewCombinedQueryBuilder {
    operationName: string;
    add: <TData = any, TVariables extends OperationVariables = {}>(id: string, document: DocumentNode, variables?: TVariables) => CombinedQueryBuilder<TData>;
    addN: <TVariables extends OperationVariables = {}>(id: string, document: DocumentNode, variables: TVariables[], variableRenameFn?: RenameFnWithIndex, fieldRenameFn?: RenameFnWithIndex) => CombinedQueryBuilder<{}, {}>;
}
export interface CombinedQueryBuilder<TData = any, TVariables extends OperationVariables = {}> {
    document: DocumentNode;
    variables?: TVariables;
    add: <TDataAdd = any, TVariablesAdd extends OperationVariables = {}>(id: string, document: DocumentNode, variables?: TVariablesAdd) => CombinedQueryBuilder<TData & TDataAdd, TVariables & TVariablesAdd>;
    addN: <TVariablesAdd extends OperationVariables = {}>(id: string, document: DocumentNode, variables: TVariablesAdd[], variableRenameFn?: RenameFnWithIndex, fieldRenameFn?: RenameFnWithIndex) => CombinedQueryBuilder<TData, TVariables>;
}
export default function combinedQuery(operationName: string): NewCombinedQueryBuilder;
export {};
//# sourceMappingURL=index.d.ts.map