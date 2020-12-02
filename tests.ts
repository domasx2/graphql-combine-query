import { parse } from 'graphql'
import { print } from 'graphql/language/printer'
import { expect } from 'chai'
import combinedQuery from './src'

describe('combinedQuery', () => {
  it('should combine multiple simple queries', () => {
    const fooQuery = parse(`
      query FooQuery($foo: String!) {
        getFoo(foo: $foo)
      }
    `)

    const barQuery = parse(`
      query BarQuery($bar: String!) {
        getBar(bar: $bar)
      }
    `)

    const { document, variables } = combinedQuery('FooBarQuery')
      .add<{ getFoo: String }, { foo: String }>(fooQuery, { foo : 'bbb'})
      .add<{ getBar: String }, { bar: String }>(barQuery, { bar : 'ccc'})

    expect(variables).deep.equal({
      foo: 'bbb',
      bar: 'ccc'
    })

    expect(print(document)).equal(`query FooBarQuery($foo: String!, $bar: String!) {
  getFoo(foo: $foo)
  getBar(bar: $bar)
}
`)
  })
  it('should combine multiple simple queries with the same fragment', () => {
    const templateName = 'FizzTemplate'
    const fizzTemplate = (`
      fragment ${templateName} on Fizz {
        fizzField
      }
    `)

    const fooQuery = parse(`
      query FooQuery($foo: String!) {
        getFoo(foo: $foo) {
          ...fizzTemplate
        }
      }
      ${fizzTemplate}
    `)

    const barQuery = parse(`
      query BarQuery($bar: String!) {
        getBar(bar: $bar) {
          ...fizzTemplate
        }
      }
      ${fizzTemplate}
    `)

    const { document, variables } = combinedQuery('FooBarQuery')
      .add<{ getFoo: String }, { foo: String }>(fooQuery, { foo : 'bbb'})
      .add<{ getBar: String }, { bar: String }>(barQuery, { bar : 'ccc'})

    expect(variables).deep.equal({
      foo: 'bbb',
      bar: 'ccc'
    })
    const fragmentDefinitions = document.definitions.filter((d: any) => d.name.value === templateName)
    expect(fragmentDefinitions.length).equal(1)
  })
  it('should combine multiple simple queries with multiple fragments', () => {
    const templateName = 'FizzTemplate'
    const fizzTemplate = (`
      fragment ${templateName} on Fizz {
        fizzField
      }
    `)

    const bizzTemplate = (`
      fragment bizzTemplate on Bizz {
        bizzField
      }
    `)

    const fooQuery = parse(`
      query FooQuery($foo: String!) {
        getFoo(foo: $foo) {
          ...fizzTemplate
        }
      }
      ${fizzTemplate}
    `)

    const barQuery = parse(`
      query BarQuery($bar: String!) {
        getBar(bar: $bar) {
          ...fizzTemplate
        }
      }
      ${fizzTemplate}
    `)

    const bizzQuery = parse(`
      query BizzQuery($bizz: String!) {
        getBizz(bizz: $bizz) {
          ...bizzTemplate
        }
      }
      ${bizzTemplate}
    `)

    const { document, variables } = combinedQuery('FooBarQuery')
      .add<{ getFoo: String }, { foo: String }>(fooQuery, { foo : 'bbb'})
      .add<{ getBar: String }, { bar: String }>(barQuery, { bar : 'ccc'})
      .add<{ getBar: String }, { bizz: String }>(bizzQuery, { bizz : 'ddd'})


    expect(variables).deep.equal({
      foo: 'bbb',
      bar: 'ccc',
      bizz : 'ddd'
    })
    const fragmentDefinitions = document.definitions.filter((d: any) => d.kind === 'FragmentDefinition')
    expect(fragmentDefinitions.length).equal(2)
  })

  it('should cominbe multiple mutations', () => {
    const fooMutation = parse(`
      mutation FooQuery($foo: String!) {
        doFoo(foo: $foo)
      }
    `)

    const barMutation = parse(`
      mutation BarQuery($bar: String!) {
        doBar(bar: $bar)
      }
    `)

    const { document, variables } = combinedQuery('FooBarMutation')
      .add<{ doFoo: String }, { foo: String }>(fooMutation, { foo : 'bbb'})
      .add<{ doBar: String }, { bar: String }>(barMutation, { bar : 'ccc'})

    expect(variables).deep.equal({
      foo: 'bbb',
      bar: 'ccc'
    })

    expect(print(document)).equal(`mutation FooBarMutation($foo: String!, $bar: String!) {
  doFoo(foo: $foo)
  doBar(bar: $bar)
}
`)
  })

  it('should add the same mutation N times with changed variables and aliases', () => {
    const fooMutation = parse(`
      mutation FooQuery($foo: String!) {
        doFoo(foo: $foo) {
          doBar(where: { foo: $foo, bar: [$foo]}) {
            zab
          }
        }
      }
    `)

    const { document, variables } = combinedQuery('FooMutation').addN(fooMutation, [
      { foo: 'one' },
      { foo: 'two' },
      { foo: 'three'}
    ])

    expect(variables).deep.equal({
      foo_0: 'one',
      foo_1: 'two',
      foo_2: 'three'
    })

    expect(print(document)).equal(`mutation FooMutation($foo_0: String!, $foo_1: String!, $foo_2: String!) {
  doFoo_0: doFoo(foo: $foo_0) {
    doBar(where: {foo: $foo_0, bar: [$foo_0]}) {
      zab
    }
  }
  doFoo_1: doFoo(foo: $foo_1) {
    doBar(where: {foo: $foo_1, bar: [$foo_1]}) {
      zab
    }
  }
  doFoo_2: doFoo(foo: $foo_2) {
    doBar(where: {foo: $foo_2, bar: [$foo_2]}) {
      zab
    }
  }
}
`)
  })

  it('combined use case', () => {
    const fooMutation = parse(`
      mutation FooMutation($foo: String!) {
        doFoo(foo: $foo)
      }
    `)

    const barMutation = parse(`
      mutation BarQuery($bar: String!, $badar: Int!) {
        doBar(bar: $bar) {
          za(ba: { b: $badar }) {
            x
          }
        }
      }
    `)

    const bazMutation = parse(`
      mutation BazMutation($baz: String!) {
        doBaz(baz: $baz)
      }
    `)

    const { document, variables } = combinedQuery('CombinedMutation')
      .add(fooMutation, { foo: 'one'})
      .addN(barMutation, [
        { bar: 'two', badar: 1},
        { bar: 'three', badar: 2}
      ])
      .add(bazMutation, { baz: 'four'})

      expect(variables).deep.equal({
        foo: 'one',
        bar_0: 'two',
        badar_0: 1,
        bar_1: 'three',
        badar_1: 2,
        baz: 'four'
      })

     expect(print(document)).equal(`mutation CombinedMutation($foo: String!, $bar_0: String!, $badar_0: Int!, $bar_1: String!, $badar_1: Int!, $baz: String!) {
  doFoo(foo: $foo)
  doBar_0: doBar(bar: $bar_0) {
    za(ba: {b: $badar_0}) {
      x
    }
  }
  doBar_1: doBar(bar: $bar_1) {
    za(ba: {b: $badar_1}) {
      x
    }
  }
  doBaz(baz: $baz)
}
`)

  })

  it('validation - different operation types', () => {
    const fooQuery = parse(`
      query FooQuery($foo: String!) {
        getFoo(foo: $foo)
      }
    `)

    const fooMutation = parse(`
      mutation FooMutation($fooo: String!) {
        doFoo(foo: $foo)
      }
    `)

    expect(() => {
      combinedQuery('test')
        .add(fooQuery, { foo: 'foo' })
        .add(fooMutation, { fooo: 'fooo'})
    }).to.throw('expected all operations to be of the smae type, but FooMutation is mutation and FooQuery is query')
  })

  it('validation - top level fields must be unique', () => {
    const fooQuery = parse(`
      query FooQuery($foo: String!) {
        foo: getFoo(foo: $foo)
      }
    `)

    const fooQuery2 = parse(`
      query FooQuery2  {
        foo
      }
    `)

    expect(() => {
      combinedQuery('test')
        .add(fooQuery, { foo: 'foo' })
        .add(fooQuery2)
    }).to.throw('duplicate field definition foo for oprations FooQuery and FooQuery2')
  })

  it('validation - variable names must be unique', () => {
    const fooQuery = parse(`
      query FooQuery($foo: String!) {
        foo: getFoo(foo: $foo)
      }
    `)

    const fooQuery2 = parse(`
      query FooQuery2($foo: String!) {
        foo2: getFoo(foo: $foo)
      }
    `)

    expect(() => {
      combinedQuery('test')
        .add(fooQuery, { foo: 'foo' })
        .add(fooQuery2, { foo: 'foo2'})
    }).to.throw('duplicate variable definition foo for oprations FooQuery and FooQuery2')
  })

  it('renaming works correctly if addN is used as the first operation', () => {
    const fooMutation = parse(`
      mutation FooQuery($foo: String!) {
        doFoo(foo: $foo)
      }
    `)

    const renamingFunction = (name: string, index: number) => {
      return `${name}___${index}`
    }

    let { document, variables } = combinedQuery('FooMutationMultiple')
      .addN<{ foo: String }>(fooMutation, [{foo: 'foo_0'}, {foo: "foo_1"}], undefined, renamingFunction)

    let query =
      `mutation FooMutationMultiple($foo_0: String!, $foo_1: String!) {
          doFoo___0: doFoo(foo: $foo_0)
          doFoo___1: doFoo(foo: $foo_1)
      }`

    query = print(parse(query))
    expect(print(document)).to.equal(query)
    expect(variables).to.include({
      foo_0: "foo_0",
      foo_1: "foo_1"
    })

    ;({ document, variables } = combinedQuery('FooMutationMultiple')
      .addN<{ foo: String }>(fooMutation, [{foo: 'foo_0'}, {foo: "foo_1"}], renamingFunction, undefined))

    query =
      `mutation FooMutationMultiple($foo___0: String!, $foo___1: String!) {
          doFoo_0: doFoo(foo: $foo___0)
          doFoo_1: doFoo(foo: $foo___1)
      }`

    query = print(parse(query))
    expect(print(document)).to.equal(query)
    expect(variables).to.include({
        foo___0: "foo_0",
        foo___1: "foo_1"
    })

    ;({ document, variables } = combinedQuery('FooMutationMultiple')
      .addN<{ foo: String }>(fooMutation, [{foo: 'foo_0'}, {foo: "foo_1"}], renamingFunction, renamingFunction))

    query =
      `mutation FooMutationMultiple($foo___0: String!, $foo___1: String!) {
          doFoo___0: doFoo(foo: $foo___0)
          doFoo___1: doFoo(foo: $foo___1)
      }`

    query = print(parse(query))
    expect(print(document)).to.equal(query)
    expect(variables).to.include({
      foo___0: "foo_0",
      foo___1: "foo_1"
    })
  })
})
