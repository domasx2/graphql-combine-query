import { SelectionSetNode } from 'graphql'
import { ArgumentNode, DirectiveNode, OperationDefinitionNode, VariableDefinitionNode, DocumentNode, DefinitionNode, ValueNode } from 'graphql/language'

export type RenameFn = (name: string) => string
export type RenameFnWithIndex  = (name: string, index: number) => string
export const defaultRenameFn: RenameFnWithIndex = (name, index) => `${name}_${index}`

export function renameValue(node: ValueNode, renameFn: RenameFn): ValueNode {
  if (node.kind === 'Variable') {
    return {
      ...node,
      name: {
        ...node.name,
        value: renameFn(node.name.value)
      }
    }
  } else if (node.kind === 'ObjectValue') {
    return {
      ...node,
      fields: node.fields.map(field => ({
        ...field,
        value: renameValue(field.value, renameFn)
      }))
    }
  } else if (node.kind === 'ListValue') {
    return {
      ...node,
      values: node.values.map(value => renameValue(value, renameFn))
    }
  }

  return node
}

export function renameArgument(node: ArgumentNode, renameFn: RenameFn): ArgumentNode {
  return {
    ...node,
    value: renameValue(node.value, renameFn)
  }
}

export function renameDirectiveArguments(node: DirectiveNode, renameFn: RenameFn): DirectiveNode {
  return {
    ...node,
    arguments: node.arguments?.map(arg => renameArgument(arg, renameFn)),
  }
}

export function renameVariableDefinition(node: VariableDefinitionNode, renameFn: RenameFn): VariableDefinitionNode {
  return {
    ...node,
    variable: {
      ...node.variable,
      name: {
        ...node.variable.name,
        value: renameFn(node.variable.name.value)
      },
    },
    directives: node.directives?.map(dir => renameDirectiveArguments(dir, renameFn))
  }
}

export function renameSelectionSetArguments(selectionSet: SelectionSetNode, renameFn: (name: string) => string): SelectionSetNode {
  return {
    ...selectionSet,
    selections: selectionSet.selections.map(sel => {
      switch (sel.kind) {
        case 'Field':
          return {
            ...sel,
            arguments: sel.arguments?.map(arg => renameArgument(arg, renameFn)),
            selectionSet: sel.selectionSet ? renameSelectionSetArguments(sel.selectionSet, renameFn) : undefined
          }
        case 'FragmentSpread':
          return {
            ...sel,
            directives: sel.directives?.map(dir => renameDirectiveArguments(dir, renameFn))
          }
        case 'InlineFragment': 
          return {
            ...sel,
            directives: sel.directives?.map(dir => renameDirectiveArguments(dir, renameFn)),
            selectionSet: renameSelectionSetArguments(sel.selectionSet, renameFn)
          }
        }
    })
  }
}

export function renameVariablesAndTopLevelFieldsOnOpDef(op: OperationDefinitionNode, variableRenameFn: RenameFn, fieldRenameFn: RenameFn): OperationDefinitionNode {
  return {
    ...op,
    variableDefinitions: op.variableDefinitions?.map(vardef => renameVariableDefinition(vardef, variableRenameFn)),
    directives: op.directives?.map(dir => renameDirectiveArguments(dir, variableRenameFn)),
    selectionSet: renameSelectionSetArguments({
      ...op.selectionSet,
      selections: op.selectionSet.selections.map(sel => {
        switch (sel.kind) {
          case 'Field':
            return {
              ...sel,
              alias: {
                ...sel.name,
                value: fieldRenameFn(sel.alias?.value ?? sel.name.value)
              }
            }
          default:
            return sel
        }
      })
    }, variableRenameFn)
  }
}

export function renameVariablesAndTopLevelFields(doc: DocumentNode, variableRenameFn: RenameFn, fieldRenameFn: RenameFn): DocumentNode {
  return {
    ...doc,
    definitions: [
      ...doc.definitions.filter(def => def.kind !== 'OperationDefinition'),
      ...doc.definitions.filter((def: DefinitionNode): def is OperationDefinitionNode => def.kind === 'OperationDefinition').map(opDef=> {
        return renameVariablesAndTopLevelFieldsOnOpDef(opDef, variableRenameFn, fieldRenameFn)
      })
    ]
  }
}

export function renameVariables(variables: Record<string, any>, renameFn: RenameFn): Record<string, any> {
  return Object.keys(variables).reduce((vars, key) => {
    return {
      ...vars,
      [renameFn(key)]: variables[key]
    }
  }, {})
}
