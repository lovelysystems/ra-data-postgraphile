/* eslint-disable @typescript-eslint/ban-ts-comment */

/**
 * COPY of https://github.com/marmelab/react-admin/blob/v3.19.0/packages/ra-data-graphql/src/index.ts
 * due to Typescript rewrite of the react-admin/ra-data-graphql package from 3.18.x -> 3.19.x
 *
 * Lovely CMS requires some modifications in here in order to work properly:
 *
 *  - custom fetch types (e.g. "publish", "unpublish")
 */
import merge from 'lodash/merge'
import get from 'lodash/get'
import pluralize from 'pluralize'
import {
  DataProvider,
  HttpError,
  GET_LIST,
  GET_ONE,
  GET_MANY,
  GET_MANY_REFERENCE,
  CREATE,
  UPDATE,
  DELETE,
  DELETE_MANY,
  UPDATE_MANY,
} from 'react-admin'
import {
  ApolloError,
  ApolloQueryResult,
  DocumentNode,
  OperationVariables,
  ServerError,
  TypedDocumentNode,
} from '@apollo/client'

import {
  GetMutationOptions,
  GetQueryOptions,
  GetWatchQueryOptions,
  QUERY_TYPES as INNER_QUERY_TYPES,
  MUTATION_TYPES as INNER_MUTATION_TYPES,
  ALL_TYPES as INNER_ALL_TYPES,
  introspectSchema,
  IntrospectionResult,
  Options,
} from 'ra-data-graphql'
import buildApolloClient from 'ra-data-graphql/lib/buildApolloClient'

export const QUERY_TYPES = INNER_QUERY_TYPES
export const MUTATION_TYPES = INNER_MUTATION_TYPES
export const ALL_TYPES = INNER_ALL_TYPES

const RaFetchMethodMap = {
  getList: GET_LIST,
  getMany: GET_MANY,
  getManyReference: GET_MANY_REFERENCE,
  getOne: GET_ONE,
  create: CREATE,
  delete: DELETE,
  deleteMany: DELETE_MANY,
  update: UPDATE,
  updateMany: UPDATE_MANY,
}
const defaultOptions = {
  resolveIntrospection: introspectSchema,
  introspection: {
    operationNames: {
      [GET_LIST]: (resource: { name: string }) =>
        `all${pluralize(resource.name)}`,
      [GET_ONE]: (resource: { name: string }) => `${resource.name}`,
      [GET_MANY]: (resource: { name: string }) =>
        `all${pluralize(resource.name)}`,
      [GET_MANY_REFERENCE]: (resource: { name: string }) =>
        `all${pluralize(resource.name)}`,
      [CREATE]: (resource: { name: string }) => `create${resource.name}`,
      [UPDATE]: (resource: { name: string }) => `update${resource.name}`,
      [DELETE]: (resource: { name: string }) => `delete${resource.name}`,
    },
    exclude: undefined,
    include: undefined,
  },
}

const getOptions = (
  options:
    | GetQueryOptions
    | GetMutationOptions
    | GetWatchQueryOptions
    | undefined,
  raFetchMethod: string,
  resource: string,
) => {
  if (options && typeof options === 'function') {
    return options(resource, raFetchMethod)
  }

  return options
}

export default async (options: Options): Promise<DataProvider> => {
  const {
    client: clientObject,
    clientOptions,
    introspection,
    resolveIntrospection,
    buildQuery: buildQueryFactory,
    override = {},
    ...otherOptions
  } = merge({}, defaultOptions, options)

  if (override && process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line no-console
    console.warn(
      'The override option is deprecated. You should instead wrap the buildQuery function provided by the dataProvider you use.',
    )
  }

  const client =
    clientObject || (clientOptions && buildApolloClient(clientOptions))

  let introspectionResults: IntrospectionResult

  if (!client) {
    // @ts-ignore
    return defaultDataProvider
  }

  // @ts-ignore
  const raDataProvider = new Proxy<DataProvider>(defaultDataProvider, {
    get: (target, name) => {
      if (typeof name === 'symbol' || name === 'then') {
        return
      }
      // IMPORTANT
      // fallback to custom fetch method if not found in existing map
      // Required to get fetch types e.g. "publish" to work
      const raFetchMethod = get(RaFetchMethodMap, name) ?? name
      // eslint-disable-next-line consistent-return
      return async (resource: string, params: any) => {
        if (introspection) {
          introspectionResults = await resolveIntrospection(
            client,
            introspection,
          )
        }

        const buildQuery = buildQueryFactory(introspectionResults)
        const overriddenBuildQuery = get(
          override,
          `${resource}.${raFetchMethod}`,
        )

        const { parseResponse, ...query } = overriddenBuildQuery
          ? {
              ...buildQuery(raFetchMethod, resource, params),
              ...overriddenBuildQuery(params),
            }
          : buildQuery(raFetchMethod, resource, params)

        const operation = getQueryOperation(query.query)

        if (operation === 'query') {
          const apolloQuery = {
            ...query,
            fetchPolicy: 'network-only',
            ...getOptions(otherOptions.query, raFetchMethod, resource),
          }

          return (
            client
              // @ts-ignore
              .query(apolloQuery)
              .then((response: ApolloQueryResult<any>) =>
                parseResponse(response),
              )
              .catch(handleError)
          )
        }

        const apolloQuery = {
          mutation: query.query,
          variables: query.variables,
          ...getOptions(otherOptions.mutation, raFetchMethod, resource),
        }
        // @ts-ignore
        return client.mutate(apolloQuery).then(parseResponse).catch(handleError)
      }
    },
  })

  return raDataProvider
}

const handleError = (error: ApolloError) => {
  // eslint-disable-next-line no-console
  console.error({ error })
  if (error?.networkError as ServerError) {
    throw new HttpError(
      (error?.networkError as ServerError)?.message,
      (error?.networkError as ServerError)?.statusCode,
    )
  }

  throw new HttpError(error.message, 200)
}

const getQueryOperation = (
  query: DocumentNode | TypedDocumentNode<any, OperationVariables>,
) => {
  if (query && query.definitions && query.definitions.length > 0) {
    // @ts-ignore
    return query.definitions[0].operation
  }

  throw new Error('Unable to determine the query operation')
}

// Only used to initialize proxy
const defaultDataProvider = {
  create: () => Promise.resolve({ data: null }), // avoids adding a context in tests
  delete: () => Promise.resolve({ data: null }), // avoids adding a context in tests
  deleteMany: () => Promise.resolve({ data: [] }), // avoids adding a context in tests
  getList: () => Promise.resolve({ data: [], total: 0 }), // avoids adding a context in tests
  getMany: () => Promise.resolve({ data: [] }), // avoids adding a context in tests
  getManyReference: () => Promise.resolve({ data: [], total: 0 }), // avoids adding a context in tests
  getOne: () => Promise.resolve({ data: null }), // avoids adding a context in tests
  update: () => Promise.resolve({ data: null }), // avoids adding a context in tests
  updateMany: () => Promise.resolve({ data: [] }), // avoids adding a context in tests
}
