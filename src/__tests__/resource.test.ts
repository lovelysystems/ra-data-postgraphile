import { print } from 'graphql/language/printer'

import {
  GET_ONE,
  GET_MANY,
  GET_LIST,
  CREATE,
  UPDATE,
  UPDATE_MANY,
  GET_MANY_REFERENCE,
  DELETE,
  DELETE_MANY,
} from 'ra-core'

import { TestTypes, TestQueries } from './helpers'

import resourceFactory from '../resource'


describe('resource', () => {
  const introspectionResult = {
    types: TestTypes,
    queries: TestQueries,
  }

  const TestProperties = {
    nodeId: true,
    name: true,
    id: true,
  }

  const CompoundProperties = {
    nodeId: true,
    name: true,
    id: true,
  }

  const OPTIONS = {
    resources: {
      Test: {
        querySettings: {
          [GET_ONE]: TestProperties,
          [GET_LIST]: TestProperties,
          [CREATE]: TestProperties,
          [UPDATE]: TestProperties,
          [DELETE]: TestProperties,
        }
      },
      Compound: {
        querySettings: {
          [GET_ONE]: CompoundProperties,
          [GET_LIST]: CompoundProperties,
          [CREATE]: CompoundProperties,
          [UPDATE]: CompoundProperties,
          [DELETE]: CompoundProperties,
        }
      }
    }
  }

  it('provides the query builder', () => {
    expect(resourceFactory(introspectionResult, { options: OPTIONS })).not.toBeNull()
  })

  describe('with single column key', () => {
    it('GET_ONE provides a query', () => {
      const provider = resourceFactory(introspectionResult, { options: OPTIONS })
      const result = provider(GET_ONE, 'Test', { id: 1 })
      expect(result.variables).toStrictEqual({ id: 1 })
      expect(print(result.query)).toStrictEqual(`query test($id: Int!) {
  test(id: $id) {
    nodeId
    name
    id
  }
}
`)
      expect(
        result.parseResponse({
          data: {
            test: {
              id: 1,
            },
          },
        }),
      ).toStrictEqual({
        data: {
          id: 1,
        },
      })
    })

    it('GET_MANY provides a query', () => {
      const provider = resourceFactory(introspectionResult, { options: OPTIONS })
      const result = provider(GET_MANY, 'Test', { ids: [1, 2] })
      expect(result.variables).toStrictEqual({ ids: [1, 2] })
      expect(print(result.query)).toStrictEqual(`query tests($ids: [Int!]) {
  tests(filter: {id: {in: $ids}}) {
    nodes {
      nodeId
      name
      id
    }
  }
}
`)
      expect(
        result.parseResponse({
          data: {
            tests: {
              nodes: [
                {
                  id: 1,
                  name: 'name 1',
                },
                {
                  id: 2,
                  name: 'name 2',
                },
              ],
            },
          },
        }),
      ).toStrictEqual({
        data: [
          {
            id: 1,
            name: 'name 1',
          },
          {
            id: 2,
            name: 'name 2',
          },
        ],
      })
    })

    it('CREATE provides a mutation', () => {
      const provider = resourceFactory(introspectionResult, { options: OPTIONS })
      const result = provider(CREATE, 'Test', { data: { name: 'the name' } })
      expect(result.variables).toStrictEqual({
        input: {
          test: {
            name: 'the name',
          },
        },
      })
      expect(result.parseResponse).not.toBeNull()
      expect(print(result.query))
        .toStrictEqual(`mutation createTest($input: CreateTestInput!) {
  createTest(input: $input) {
    test {
      nodeId
      name
      id
    }
  }
}
`)
      expect(
        result.parseResponse({
          data: {
            createTest: {
              test: {
                id: 1,
                name: 'name 1',
                nodeId: 'nodeid1',
              },
            },
          },
        }),
      ).toStrictEqual({
        data: {
          id: 1,
          name: 'name 1',
          nodeId: 'nodeid1',
        },
      })
    })

    it('UPDATE provides a mutation', () => {
      const provider = resourceFactory(introspectionResult, { options: OPTIONS })
      const result = provider(UPDATE, 'Test', {
        id: 1,
        data: { name: 'the name' },
      })
      expect(result.variables).toStrictEqual({
        input: {
          id: 1,
          patch: {
            name: 'the name',
          },
        },
      })
      expect(print(result.query))
        .toStrictEqual(`mutation updateTest($input: UpdateTestInput!) {
  updateTest(input: $input) {
    test {
      nodeId
      name
      id
    }
  }
}
`)
      expect(
        result.parseResponse({
          data: {
            updateTest: {
              test: {
                id: 1,
                name: 'name 1',
                nodeId: 'nodeid1',
              },
            },
          },
        }),
      ).toStrictEqual({
        data: {
          id: 1,
          name: 'name 1',
          nodeId: 'nodeid1',
        },
      })
    })

    it('UPDATE_MANY provides a mutation', () => {
      const provider = resourceFactory(introspectionResult, { options: OPTIONS })
      const result = provider(UPDATE_MANY, 'Test', {
        ids: [1, 2],
        data: {
          name: 'the name for all',
        },
      })
      expect(result.variables).toStrictEqual({
        arg1: {
          clientMutationId: '1',
          id: 1,
          patch: {
            name: 'the name for all',
          },
        },
        arg2: {
          clientMutationId: '2',
          id: 2,
          patch: {
            name: 'the name for all',
          },
        },
      })
      expect(print(result.query))
        .toStrictEqual(`mutation updateManyTest($arg1: UpdateTestInput!, $arg2: UpdateTestInput!) {
  update1: updateTest(input: $arg1) {
    clientMutationId
  }
  update2: updateTest(input: $arg2) {
    clientMutationId
  }
}
`)
      expect(
        result.parseResponse({
          data: {
            update1: {
              clientMutationId: '1',
            },
            update2: {
              clientMutationId: '2',
            },
          },
        }),
      ).toStrictEqual({
        data: [1, 2],
      })
    })

    it('GET_LIST provides a query', () => {
      const provider = resourceFactory(introspectionResult, { options: OPTIONS })
      const result = provider(GET_LIST, 'Test', {
        pagination: { page: 1, perPage: 10 },
      })
      expect(result.variables).toStrictEqual({
        filter: undefined,
        first: 10,
        offset: 0,
        orderBy: ['NATURAL'],
      })
      expect(print(result.query))
        .toStrictEqual(`query tests($offset: Int!, $first: Int!, $filter: TestFilter, $orderBy: [TestsOrderBy!]) {
  tests(first: $first, offset: $offset, filter: $filter, orderBy: $orderBy) {
    nodes {
      nodeId
      name
      id
    }
    totalCount
  }
}
`)
      expect(
        result.parseResponse({
          data: {
            tests: {
              nodes: [
                {
                  id: 1,
                  nodeId: 'nodeid1',
                  name: 'name 1',
                },
                {
                  id: 2,
                  nodeId: 'nodeid2',
                  name: 'name 2',
                },
              ],
              totalCount: 42,
            },
          },
        }),
      ).toStrictEqual({
        data: [
          {
            id: 1,
            name: 'name 1',
            nodeId: 'nodeid1',
          },
          {
            id: 2,
            name: 'name 2',
            nodeId: 'nodeid2',
          },
        ],
        total: 42,
      })
    })

    it('GET_LIST provides a query with sorting', () => {
      const provider = resourceFactory(introspectionResult, { options: OPTIONS })
      const result = provider(GET_LIST, 'Test', {
        sort: { field: 'name', order: 'DESC' },
        pagination: { page: 1, perPage: 10 },
      })
      expect(result.variables).toStrictEqual({
        filter: undefined,
        first: 10,
        offset: 0,
        orderBy: ['NAME_DESC'],
      })
    })

    it('GET_MANY_REFERENCE provides a query', () => {
      const provider = resourceFactory(introspectionResult, { options: OPTIONS })
      const result = provider(GET_MANY_REFERENCE, 'Test', {
        target: 'id',
        id: 1,
        filter: {},
        pagination: { page: 1, perPage: 10 },
      })
      expect(result.variables).toStrictEqual({
        filter: {
          and: [
            {
              id: {
                equalTo: 1,
              },
            },
          ],
        },
        first: 10,
        offset: 0,
        orderBy: ['NATURAL'],
      })
      expect(print(result.query))
        .toStrictEqual(`query tests($offset: Int!, $first: Int!, $filter: TestFilter, $orderBy: [TestsOrderBy!]) {
  tests(first: $first, offset: $offset, filter: $filter, orderBy: $orderBy) {
    nodes {
      nodeId
      name
      id
    }
    totalCount
  }
}
`)
      expect(
        result.parseResponse({
          data: {
            tests: {
              nodes: [
                {
                  id: 1,
                  nodeId: 'nodeid1',
                  name: 'name 1',
                },
                {
                  id: 2,
                  nodeId: 'nodeid2',
                  name: 'name 2',
                },
              ],
              totalCount: 42,
            },
          },
        }),
      ).toStrictEqual({
        data: [
          {
            id: 1,
            name: 'name 1',
            nodeId: 'nodeid1',
          },
          {
            id: 2,
            name: 'name 2',
            nodeId: 'nodeid2',
          },
        ],
        total: 42,
      })
    })

    it('DELETE', () => {
      const provider = resourceFactory(introspectionResult, { options: OPTIONS })
      const result = provider(DELETE, 'Test', { id: 1 })
      expect(result.variables).toStrictEqual({input: { id: 1 }})
      expect(print(result.query))
        .toStrictEqual(`mutation deleteTest($input: DeleteTestInput!) {
  deleteTest(input: $input) {
    test {
      nodeId
      name
      id
    }
  }
}
`)
      expect(
        result.parseResponse({
          data: {
            deleteTest: {
              test: {
                id: 1,
                name: 'name 1',
                nodeId: 'nodeid1',
              },
            },
          },
        }),
      ).toStrictEqual({
        data: {
          id: 1,
          name: 'name 1',
          nodeId: 'nodeid1',
        },
      })
    })

    it('DELETE_MANY is not implemented', () => {
      const provider = resourceFactory(introspectionResult, { options: OPTIONS })
      expect(() => provider(DELETE_MANY, 'Test', { id: 1 })).toThrowError(
        'DELETE_MANY is not implemented for type "Test"',
      )
    })
  })

  describe('with compound key', () => {
    it('provides a nodeId query for compound keys', () => {
      const provider = resourceFactory(introspectionResult, { options: OPTIONS })
      const result = provider(GET_ONE, 'Compound', { id: 1 })
      expect(result.variables).toStrictEqual({ id: 1 })
      expect(print(result.query))
        .toStrictEqual(`query compoundByNodeId($id: ID!) {
  compoundByNodeId(nodeId: $id) {
    nodeId
    name
    id
  }
}
`)
      expect(
        result.parseResponse({
          data: {
            compoundByNodeId: {
              id: 1,
              nodeId: 'nodeid1',
            },
          },
        }),
      ).toStrictEqual({
        data: {
          __rawId: 1,
          id: 'nodeid1',
          nodeId: 'nodeid1',
        },
      })
    })

    it('GET_MANY provides a query', () => {
      const provider = resourceFactory(introspectionResult, { options: OPTIONS })
      const result = provider(GET_MANY, 'Compound', { ids: [1, 2] })
      expect(result.variables).toStrictEqual({ ids: [1, 2] })
      expect(print(result.query)).toStrictEqual(`query compounds($ids: [ID!]) {
  compounds(filter: {nodeId: {in: $ids}}) {
    nodes {
      nodeId
      name
      id
    }
  }
}
`)
      expect(
        result.parseResponse({
          data: {
            compounds: {
              nodes: [
                {
                  id: 1,
                  name: 'name 1',
                  nodeId: 'nodeid1',
                },
                {
                  id: 2,
                  name: 'name 2',
                  nodeId: 'nodeid2',
                },
              ],
            },
          },
        }),
      ).toStrictEqual({
        data: [
          {
            __rawId: 1,
            id: 'nodeid1',
            name: 'name 1',
            nodeId: 'nodeid1',
          },
          {
            __rawId: 2,
            id: 'nodeid2',
            name: 'name 2',
            nodeId: 'nodeid2',
          },
        ],
      })
    })

    it('CREATE provides a mutation', () => {
      const provider = resourceFactory(introspectionResult, { options: OPTIONS })
      const result = provider(CREATE, 'Compound', {
        data: { name: 'the name' },
      })
      expect(result.variables).toStrictEqual({
        input: {
          compound: {
            name: 'the name',
          },
        },
      })
      expect(print(result.query))
        .toStrictEqual(`mutation createCompound($input: CreateCompoundInput!) {
  createCompound(input: $input) {
    compound {
      nodeId
      name
      id
    }
  }
}
`)
      expect(
        result.parseResponse({
          data: {
            createCompound: {
              compound: {
                id: 1,
                name: 'name 1',
                nodeId: 'nodeid1',
              },
            },
          },
        }),
      ).toStrictEqual({
        data: {
          __rawId: 1,
          id: 'nodeid1',
          name: 'name 1',
          nodeId: 'nodeid1',
        },
      })
    })

    it('UPDATE provides a mutation', () => {
      const provider = resourceFactory(introspectionResult, { options: OPTIONS })
      const result = provider(UPDATE, 'Compound', {
        id: 'nodeId:1',
        data: {
          id: 'nodeId:1',
          name: 'the name',
          __rawId: 1,
        },
      })
      expect(result.variables).toStrictEqual({
        input: {
          id: 'nodeId:1',
          patch: {
            id: 1,
            name: 'the name',
          },
        },
      })
      expect(print(result.query))
        .toStrictEqual(`mutation updateCompoundByNodeId($input: UpdateCompoundByNodeIdInput!) {
  updateCompoundByNodeId(input: $input) {
    compound {
      nodeId
      name
      id
    }
  }
}
`)
      expect(
        result.parseResponse({
          data: {
            updateCompoundByNodeId: {
              compound: {
                id: 1,
                name: 'name 1',
                nodeId: 'nodeid1',
              },
            },
          },
        }),
      ).toStrictEqual({
        data: {
          __rawId: 1,
          id: 'nodeid1',
          name: 'name 1',
          nodeId: 'nodeid1',
        },
      })
    })

    it('UPDATE_MANY provides a mutation', () => {
      const provider = resourceFactory(introspectionResult, { options: OPTIONS })
      const result = provider(UPDATE_MANY, 'Compound', {
        ids: ['nodeId1', 'nodeId2'],
        data: {
          name: 'the name for all',
        },
      })
      expect(result.variables).toStrictEqual({
        argnodeId1: {
          clientMutationId: 'nodeId1',
          id: 'nodeId1',
          patch: {
            name: 'the name for all',
          },
        },
        argnodeId2: {
          clientMutationId: 'nodeId2',
          id: 'nodeId2',
          patch: {
            name: 'the name for all',
          },
        },
      })
      expect(print(result.query))
        .toStrictEqual(`mutation updateManyCompound($argnodeId1: UpdateCompoundByNodeIdInput!, $argnodeId2: UpdateCompoundByNodeIdInput!) {
  updatenodeId1: updateCompoundByNodeId(input: $argnodeId1) {
    clientMutationId
  }
  updatenodeId2: updateCompoundByNodeId(input: $argnodeId2) {
    clientMutationId
  }
}
`)
      expect(
        result.parseResponse({
          data: {
            updatenodeId1: {
              clientMutationId: '1',
            },
            updatenodeId2: {
              clientMutationId: '2',
            },
          },
        }),
      ).toStrictEqual({
        data: ['1', '2'],
      })
    })

    it('GET_LIST provides a query', () => {
      const provider = resourceFactory(introspectionResult, { options: OPTIONS })
      const result = provider(GET_LIST, 'Compound', {
        pagination: { page: 1, perPage: 10 },
      })
      expect(result.variables).toStrictEqual({
        filter: undefined,
        first: 10,
        offset: 0,
        orderBy: ['NATURAL'],
      })
      expect(print(result.query))
        .toStrictEqual(`query compounds($offset: Int!, $first: Int!, $filter: CompoundFilter, $orderBy: [CompoundsOrderBy!]) {
  compounds(first: $first, offset: $offset, filter: $filter, orderBy: $orderBy) {
    nodes {
      nodeId
      name
      id
    }
    totalCount
  }
}
`)
      expect(
        result.parseResponse({
          data: {
            compounds: {
              nodes: [
                {
                  id: 1,
                  nodeId: 'nodeid1',
                  name: 'name 1',
                },
                {
                  id: 2,
                  nodeId: 'nodeid2',
                  name: 'name 2',
                },
              ],
              totalCount: 42,
            },
          },
        }),
      ).toStrictEqual({
        data: [
          {
            __rawId: 1,
            id: 'nodeid1',
            name: 'name 1',
            nodeId: 'nodeid1',
          },
          {
            __rawId: 2,
            id: 'nodeid2',
            name: 'name 2',
            nodeId: 'nodeid2',
          },
        ],
        total: 42,
      })
    })
  })

  describe('throws error', () => {
    it('for unknwon resources', () => {
      const provider = resourceFactory(
        {
          types: [],
          queries: [],
        },
        { options: OPTIONS },
      )
      expect(() => provider(GET_ONE, 'Test', { id: 1 })).toThrowError(
        'Type "Test" not found in introspection',
      )
    })

    it('if method not found', () => {
      const provider = resourceFactory(
        {
          types: [{ name: 'Test' }],
          queries: [],
        },
        { options: OPTIONS },
      )
      expect(() => provider(GET_ONE, 'Test', { id: 1 })).toThrowError(
        'Query "test" for type "Test" not found in introspection',
      )
    })

    it('if method has no args', () => {
      const provider = resourceFactory(
        {
          types: [{ name: 'Test' }],
          queries: [{ name: 'test', args: [] }],
        },
        { options: OPTIONS },
      )
      expect(() => provider(GET_ONE, 'Test', { id: 1 })).toThrowError(
        'Query "test" for type "Test" has no args',
      )
    })
  })
})
