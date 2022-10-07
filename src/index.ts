import { DocumentNode, OperationDefinitionNode, DefinitionNode, FieldNode } from 'graphql'
import {
  renameVariablesAndTopLevelFields,
  RenameFnWithIndex,
  defaultRenameFn,
  renameVariables,
  RenameFn
} from './utils'

type OperationVariables = Record<string, any>

const emptyDoc: DocumentNode = {
  kind: 'Document',
  definitions: []
}

export interface NewCombinedQueryBuilder {
  operationName: string,
  add: <TData = any, TVariables extends OperationVariables = {}>(id: string, document: DocumentNode, variables?: TVariables) => CombinedQueryBuilder<TData>
  addN: <TVariables extends OperationVariables = {}>(id: string, document: DocumentNode, variables: TVariables[], variableRenameFn?: RenameFnWithIndex, fieldRenameFn?: RenameFnWithIndex) => CombinedQueryBuilder<{}, {}>
}

export interface CombinedQueryBuilder<TData = any, TVariables extends OperationVariables = {}> {
  document: DocumentNode,
  variables?: TVariables,
  add: <TDataAdd = any, TVariablesAdd extends OperationVariables = {}>(id: string, document: DocumentNode, variables?: TVariablesAdd) => CombinedQueryBuilder<TData & TDataAdd, TVariables & TVariablesAdd>
  addN: <TVariablesAdd extends OperationVariables = {}>(id: string, document: DocumentNode, variables: TVariablesAdd[], variableRenameFn?: RenameFnWithIndex, fieldRenameFn?: RenameFnWithIndex) => CombinedQueryBuilder<TData, TVariables>
}

class CombinedQueryError extends Error {
}

const renameFn: (id: string) => RenameFn = (id: string) => (varName: string) => {
  return `${id}_${varName}`
}

const prefixInput = (id: string, document: DocumentNode, variables?: OperationVariables): { document: DocumentNode, variables?: OperationVariables } => {
  return {
    document: renameVariablesAndTopLevelFields(document, renameFn(id), fieldName => fieldName),
    variables: variables && renameVariables(variables, renameFn(id))
  }
}

class CombinedQueryBuilderImpl<TData = any, TVariables extends OperationVariables = {}> implements CombinedQueryBuilder<TData> {
  id: string
  document: DocumentNode
  variables?: TVariables

  constructor(private operationName: string, id: string, document: DocumentNode, variables?: TVariables) {
    this.id = id
    this.document = document
    this.variables = variables
  }

  add<TDataAdd = any, TVariablesAdd extends OperationVariables = {}>(id: string, document: DocumentNode, variables?: TVariablesAdd): CombinedQueryBuilder<TData & TDataAdd, TVariables & TVariablesAdd> {
    const {document: updatedDocument, variables: updatedVariables} = prefixInput(id, document, variables)

    const opDefs = this.document.definitions.concat(updatedDocument.definitions).filter((def: DefinitionNode): def is OperationDefinitionNode => def.kind === 'OperationDefinition')
    if (!opDefs.length) {
      throw new CombinedQueryError('Expected at least one OperationDefinition, but found none.')
    }

    // do some basic validation
    opDefs.forEach(def => {

      const otherOpDefs = opDefs.filter(_def => _def !== def)

      // all op defs must be of the same type
      otherOpDefs.forEach(_def => {
        if (_def.operation !== def.operation) {
          throw new CombinedQueryError(`expected all operations to be of the same type, but ${_def.name?.value} is ${_def.operation} and ${def.name?.value} is ${def.operation}`)
        }
      })

      // all top level fields mut be unique. doesn't drill down fragments tho. maybe someday
      def.selectionSet.selections?.filter((s): s is FieldNode => s.kind === 'Field').forEach(sel => {
        otherOpDefs.forEach(_def => _def.selectionSet.selections?.filter((s): s is FieldNode => s.kind === 'Field').forEach(_sel => {
          if ((sel.alias?.value || sel.name.value) === (_sel.alias?.value || _sel.name.value)) {
            throw new CombinedQueryError(`duplicate field definition ${_sel.name.value} for operations ${def.name?.value} and ${_def.name?.value}`)
          }
        }))
      })

      // finally all variables must be unique
      def.variableDefinitions?.forEach(variable => {
        otherOpDefs.forEach(_def => _def.variableDefinitions?.forEach(_variable => {
          if (variable.variable.name.value === _variable.variable.name.value) {
            throw new CombinedQueryError(`duplicate variable definition ${_variable.variable.name.value} for operations ${def.name?.value} and ${_def.name?.value}`)
          }
        }))
      })
    })

    const newVars: TVariables & TVariablesAdd = (() => {
      if (this.variables && updatedVariables) {
        return {
          ...this.variables,
          ...updatedVariables
        } as TVariables & TVariablesAdd
      }
      return (updatedVariables || this.variables) as TVariables & TVariablesAdd
    })()

    let definitions: DefinitionNode[] = [{
      kind: 'OperationDefinition',
      directives: opDefs.flatMap(def => def.directives || []),
      name: {kind: 'Name', value: this.operationName},
      operation: opDefs[0].operation,
      selectionSet: {
        kind: 'SelectionSet',
        selections: opDefs.flatMap(def => def.selectionSet.selections)
      },
      variableDefinitions: opDefs.flatMap(def => def.variableDefinitions || [])
    }]
    const encounteredFragmentList = new Set<string>()
    const combinedDocumentDefinitions = this.document.definitions.concat(updatedDocument.definitions)
    for (const definition of combinedDocumentDefinitions) {
      if (definition.kind === 'OperationDefinition') {
        continue
      }
      if (definition.kind === 'FragmentDefinition') {
        if (encounteredFragmentList.has(definition.name.value)) {
          continue
        }
        encounteredFragmentList.add(definition.name.value)
      }
      definitions = [definition, ...definitions]
    }

    const newDoc: DocumentNode = {
      kind: 'Document',
      definitions
    }

    return new CombinedQueryBuilderImpl<TData & TDataAdd, TVariables & TVariablesAdd>(this.operationName, id, newDoc, newVars)
  }

  addN<TVariablesAdd extends OperationVariables = {}>(id: string, document: DocumentNode, variables: TVariablesAdd[], variableRenameFn: RenameFnWithIndex = defaultRenameFn, fieldRenameFn: RenameFnWithIndex = defaultRenameFn): CombinedQueryBuilder<TData, TVariables> {
    if (!variables.length) {
      return this
    }
    type Result = CombinedQueryBuilder<TData, TVariables & OperationVariables>
    return variables.reduce<Result>((builder, _variables, idx): Result => {
      const doc = renameVariablesAndTopLevelFields(document, name => variableRenameFn(name, idx), name => fieldRenameFn(name, idx))
      const vars = renameVariables(_variables, name => variableRenameFn(name, idx))
      return builder.add(id, doc, vars)
    }, this)
  }
}

export default function combinedQuery(operationName: string): NewCombinedQueryBuilder {
  return {
    operationName,
    add<TData = any, TVariables extends OperationVariables = {}>(id: string, document: DocumentNode, variables?: TVariables) {
      const {document: prefixedDoc, variables: prefixVars} = prefixInput(id, document, variables)
      return new CombinedQueryBuilderImpl<TData, TVariables>(this.operationName, id, prefixedDoc, prefixVars as TVariables)
    },
    addN<TVariables extends OperationVariables = {}>(id: string, document: DocumentNode, variables: TVariables[], variableRenameFn?: RenameFnWithIndex, fieldRenameFn?: RenameFnWithIndex): CombinedQueryBuilder<{}, {}> {
      return new CombinedQueryBuilderImpl<{}, {}>(this.operationName, id, emptyDoc).addN<TVariables>(id, document, variables, variableRenameFn, fieldRenameFn)
    }
  }
}
