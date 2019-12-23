import {
  GET_ONE,
  GET_LIST,
  CREATE,
  UPDATE,
  DELETE,
} from 'ra-core'
import { TestTypes, TestQueries } from './helpers'
import {
  RADataGraphqlFactory,
  ResourceOptions,
} from '../types'

import resourceFactory, { BaseResource } from '../resource'

const introspectionResult = {
  types: TestTypes,
  queries: TestQueries,
}


describe('Resource Factory', () => {

  const TestProperties = {
    nodeId: true,
    name: true,
    id: true,
  }

  it('allows to provide a pluralized name', () => {
    const provider = resourceFactory(
      introspectionResult,
      {
        options: {
          resources: {
            Test: {
              pluralizedName: 'AllTests',
              querySettings: {
                [GET_ONE]: TestProperties,
                [GET_LIST]: TestProperties,
                [CREATE]: TestProperties,
                [UPDATE]: TestProperties,
                [DELETE]: TestProperties,
              }
            }
          } as ResourceOptions
        }
      } as RADataGraphqlFactory
    )
    const result = provider(GET_LIST, 'Test', {
      pagination: { page: 1, perPage: 10 },
    })
    expect(result.query.definitions[0].name.value).toStrictEqual('allTests')
  })

  it('allows to provide a resource specific provider class', () => {
    class MyProvider extends BaseResource {
      getList = () => {
        return 'MyProvider.getList'
      }
    }
    const provider = resourceFactory(
      introspectionResult,
      {
        options: {
          resources: {
            Test: {
              resourceClass: MyProvider
            }
          } as ResourceOptions
        }
      } as RADataGraphqlFactory
    )
    const result = provider(GET_LIST, 'Test', {
      pagination: { page: 1, perPage: 10 },
    })
    expect(result).toStrictEqual('MyProvider.getList')
  })

})
