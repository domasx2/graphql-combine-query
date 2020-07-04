graphql-combine-query
=======================

This is a util to combine multiple graphql queries or mutations into a single one.

# Why?

* There are situations where you do not know ahead of time what fields will need to be invoked with a mutation, so cannot prepate a single graphql document ahead of time
* Some graphql servers, like [Hasura](https://hasura.io/) will execute each mutation in a single database transaction, which is desirable for changes being made
* It just might be easier to deal with state of a single query/mutation compared to making several calls to backend

# Install

```sh
yarn install graphql-combine-query
```
# Usage / examples


## combine several queries / mutations together

create query builder with `combineQuery(newQueryName)` and use `.add(document, variables)` to add queries to it.
argument list & top level selections are concatenated

```javascript
import comineQuery from 'graphql-combine-query'

import gql from 'graphql-tag'

const fooQuery = gql`
  query FooQuery($foo: String!) {
    getFoo(foo: $foo)
  }
`

const barQuery = gql`
  query BarQuery($bar: String!) {
    getBar(bar: $bar)
  }
`

const { document, variables } = combineQuery('FooBarQuery')
  .add(fooQuery, { foo: 'some value' })
  .add(barQuery, { bar: 'another value' })

console.log(variables)
// { foo: 'some value', bar: 'another value' }

print(document)
/*
query FooBarQuery($foo: String!, $bar: String!) {
   getFoo(foo: $foo)
   getBar(bar: $bar)
}
*/
```

## add multiple instances of the same query / mutation

It's not uncommon to need to add the same mutation several times, eg when updating multiple objects.
In this case use `addN(document, variables[])`
Arguments & top level selections will be renamed/aliased with index appended.

Let's say we want to create foo and update several bars by id:

```javascript
import comineQuery from 'graphql-combine-query'

import gql from 'graphql-tag'

const createFooMutation = gql`
  mutation CreateFoo($foo: foo_input!) {
    createFoo(foo: $foo) {
      id
    }
  }
`

const updateBarMutation = gql`
  mutation UpdateBar($bar_id: Int!, $bar: bar_update_input!) {
    updateBar(where: { id: { _eq: $bar_id } }, _set: $bar) {
      id
    }
  }
`

const { document, variables } = (() => combineQuery('CompositeMutation')
  .add(createFooMutation, { foo: { name: 'A foo' }})
  .addN(updateBarMutation, [
    { bar_id: 1, bar: { name: 'Some bar' }},
    { bar_id: 2, bar: { name: 'Another bar' }}
  ])
)()

console.log(variables)
/*
{
  foo: { name: 'A foo' },
  bar_id_0: 1,
  bar_0: { name: 'Some bar' },
  bar_id_1: 2,
  bar_1: { name: 'Another bar' }
}

*/

print(document)

/*
mutation CompositeMutation($foo: foo_input!, $bar_id_0: Int!, $bar_0: bar_update_input!, $bar_id_1: Int!, $bar_1: bar_update_input!) {
    createFoo(foo: $foo) {\n
      id
    }
    updateBar_0: updateBar(where: {id: {_eq: $bar_id_0}}, _set: $bar_0) {
      id
    }
    updateBar_1: updateBar(where: {id: {_eq: $bar_id_1}}, _set: $bar_1) {
      id
    }
  } 
*/
```