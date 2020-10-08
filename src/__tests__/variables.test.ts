import { TestTypes, TestQueries } from './helpers'
import { createTypeMap } from '../utils'
import { BaseResource } from '../resource'

describe('BaseResource.recordToVariables', () => {
  const introspectionResults = {
    types: TestTypes,
    queries: TestQueries,
  }
  const mappedIntrospection: MappedIntrospectionResult = {
    ...introspectionResults,
    types: createTypeMap(introspectionResults.types),
    queries: createTypeMap(introspectionResults.queries),
  }

  const resource = new BaseResource(mappedIntrospection, 'Test', {
    options: {
      resources: {
        Test: {
          pluralizedName: 'AllTests',
        },
      },
    },
  })

  it('maps simple types', () => {
    expect(
      resource.recordToVariables(
        {
          name: 'the name',
          deleted: false,
        },
        resource.introspection.inputType,
      ),
    ).toStrictEqual({
      deleted: false,
      name: 'the name',
    })
  })

  it('maps object types', () => {
    expect(
      resource.recordToVariables(
        {
          name: 'the blocks',
          blocks: [],
        },
        resource.introspection.inputType,
      ),
    ).toStrictEqual({
      blocks: [],
      name: 'the blocks',
    })
    expect(
      resource.recordToVariables(
        {
          name: 'the blocks',
          blocks: [{ type: 'text', value: 'text' }],
        },
        resource.introspection.inputType,
      ),
    ).toStrictEqual({
      blocks: [{ type: 'text', value: 'text' }],
      name: 'the blocks',
    })
  })

  it('removes __typename on object fields', () => {
    // reason: {x:1, y:0, __typename: 'Point'} would lead to error on Postgres Point columns:
    // Field "__typename" is not defined by type PointInput.
    expect(
      resource.recordToVariables(
        {
          name: 'the block',
          blocks: [],
          block: {
            type: 'text',
            __typename: 'ContentBlock',
          },
        },
        resource.introspection.inputType,
      ),
    ).toStrictEqual({
      name: 'the block',
      blocks: [],
      block: { type: 'text' },
    })
  })

  it('allows to map properties based on its type', () => {
    // the resource.valueToQueryVariablesMap can provide transformations based
    // type names:
    resource.valueToQueryVariablesMap = {
      ContentBlock: (value) => {
        return value.type === 'remove' ? null : value
      },
    }
    expect(
      resource.recordToVariables(
        {
          blocks: [{ type: 'text' }, { type: 'remove' }],
        },
        resource.introspection.inputType,
      ),
    ).toStrictEqual({
      blocks: [{ type: 'text' }, null],
    })
  })

  it('ignores unknown input fields', () => {
    expect(
      resource.recordToVariables(
        {
          unknwon: 'the unknown',
        },
        resource.introspection.inputType,
      ),
    ).toStrictEqual({})
  })

  it('can handle empty input', () => {
    expect(
      resource.recordToVariables({}, resource.introspection.inputType),
    ).toStrictEqual({})
  })
})
