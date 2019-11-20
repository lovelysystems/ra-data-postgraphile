import gql from 'graphql-tag'
import {
  GET_LIST,
  GET_ONE,
  GET_MANY,
  CREATE,
  UPDATE,
  UPDATE_MANY,
  GET_MANY_REFERENCE,
  GetOneParams,
  GetManyParams,
  GetManyReferenceParams,
  UpdateParams,
  UpdateManyParams,
  CreateParams,
  GetListParams,
  LegacyDataProvider,
} from 'ra-core'
import {
  capitalize,
  lowercase,
  createTypeMap,
  createSortingKey,
  createQueryFromType,
  mapInputToVariables,
} from './utils'
import { createFilter } from './filters'
import {
  NATURAL_SORTING,
  Factory,
  GQLType,
  ProviderOptions,
  Response,
} from './types'

type FetchFN = (params: any) => any
type FetchFNMap = {
  [key: string]: FetchFN
}

type Transformations = {
  [key: string]: any
}

const TYPE_TRANSFORMATIONS: Transformations = {
  Int: Number,
}

function gqlTypeConverter(type: string): { (v: any): any } {
  return (value: any): any => {
    return (TYPE_TRANSFORMATIONS[type] || ((): any => value))(value)
  }
}

type IntrospectionResult = {
  types: [any]
  queries: [any]
}

type MappedIntrospectionResult = {
  types: { [key: string]: GQLType }
  queries: { [key: string]: any }
}

export default (
  introspectionResults: IntrospectionResult,
  factory: Factory,
): LegacyDataProvider => {
  const mappedIntrospection: MappedIntrospectionResult = {
    ...introspectionResults,
    types: createTypeMap(introspectionResults.types),
    queries: createTypeMap(introspectionResults.queries),
  }
  const resources: { [key: string]: any } = {}
  const { options } = factory
  return (
    raFetchType: string,
    resourceName: string,
    params: Record<string, any>,
  ): Promise<any> => {
    let resource = resources[resourceName]
    if (!resource) {
      resource = resourceQueryBuilder(
        mappedIntrospection,
        resourceName,
        options,
      )
      resources[resourceName] = resource
    }
    return resource(raFetchType, params)
  }
}

function resourceQueryBuilder(
  mappedIntrospection: MappedIntrospectionResult,
  resourceName: string,
  options: ProviderOptions,
): any {
  const queryValueToInputValueMap = options.queryValueToInputValueMap || {}
  const allowedComplexTypes = Object.keys(queryValueToInputValueMap)
  const pluralizerMap = options.typePluralizer || {}

  // build the different forms of the type name
  const queryTypeName = lowercase(resourceName)
  const typeName = capitalize(resourceName)
  const pluralizedQueryTypeName = lowercase(
    pluralizerMap[resourceName] || `${queryTypeName}s`,
  )
  const pluralizedTypeName = capitalize(pluralizedQueryTypeName)

  const type = mappedIntrospection.types[typeName]
  if (!type) {
    throw new Error(`Type "${typeName}" not found in introspection`)
  }
  const query = mappedIntrospection.queries[queryTypeName]
  if (!query) {
    throw new Error(
      `Query "${queryTypeName}" for type "${typeName}" not found in introspection`,
    )
  }

  // Getting the primary keys:
  //   The arguments for the query to get the resource (defined as lowercased
  //   resource name) are the fields defining the primary key of the resource.
  const primaryKeys = query.args
  if (!primaryKeys || primaryKeys.length === 0) {
    throw new Error(
      `Query "${queryTypeName}" for type "${typeName}" has no args`,
    )
  }

  // If there is more than one argument then this resource has a compound
  // primary key.
  const hasCompoundKey = primaryKeys.length > 1

  const prepareForReactAdmin = hasCompoundKey
    ? (data: any): any => {
        return {
          ...data,
          __rawId: data.id,
          id: data.nodeId,
        }
      }
    : (data: any): any => {
        return data
      }

  const getOneResourceName = hasCompoundKey
    ? `${queryTypeName}ByNodeId`
    : queryTypeName
  const getOneIdType = hasCompoundKey ? 'ID' : primaryKeys[0].type.ofType.name
  const getOneArgs = `$id: ${getOneIdType}!`
  const getOneParams = hasCompoundKey
    ? 'nodeId: $id'
    : `${primaryKeys[0].name}: $id`

  const convertType = gqlTypeConverter(getOneIdType)

  function getOne(params: GetOneParams): any {
    return {
      query: gql`query ${getOneResourceName}(${getOneArgs}) {
        ${getOneResourceName}(${getOneParams}) {
        ${createQueryFromType(
          typeName,
          mappedIntrospection.types,
          allowedComplexTypes,
        )}
      }}`,
      variables: { id: convertType(params.id) },
      parseResponse: (response: Response) => {
        return {
          data: prepareForReactAdmin(response.data[getOneResourceName]),
        }
      },
    }
  }

  const getManyArgs = `$ids: [${getOneIdType}!]`
  const getManyFilter = hasCompoundKey
    ? '{ nodeId: { in: $ids }}'
    : `{ ${primaryKeys[0].name}: { in: $ids }}`

  function getMany(params: GetManyParams) {
    return {
      query: gql`query ${pluralizedQueryTypeName}(${getManyArgs}) {
        ${pluralizedQueryTypeName}(filter: ${getManyFilter}) {
          nodes {
            ${createQueryFromType(
              typeName,
              mappedIntrospection.types,
              allowedComplexTypes,
            )}
          }
      }}`,
      variables: {
        ids: params.ids.filter(v => Boolean(v)).map(convertType),
      },
      parseResponse: (response: Response) => {
        const { nodes } = response.data[pluralizedQueryTypeName]
        return {
          data: nodes.map(prepareForReactAdmin),
        }
      },
    }
  }

  function createGetListQuery() {
    return gql`query ${pluralizedQueryTypeName} (
      $offset: Int!,
      $first: Int!,
      $filter: ${typeName}Filter,
      $orderBy: [${pluralizedTypeName}OrderBy!]
      ) {
          ${pluralizedQueryTypeName}(
            first: $first, offset: $offset, filter: $filter, orderBy: $orderBy
          ) {
          nodes {
              ${createQueryFromType(
                typeName,
                mappedIntrospection.types,
                allowedComplexTypes,
              )}
          }
          totalCount
    }}`
  }

  function createGetListVariables(params: GetListParams) {
    const { filter, sort, pagination } = params
    const orderBy = sort
      ? [createSortingKey(sort.field, sort.order)]
      : [NATURAL_SORTING]
    const filters = createFilter(filter, type)
    return {
      offset: (pagination.page - 1) * pagination.perPage,
      first: pagination.perPage,
      filter: filters,
      orderBy,
    }
  }

  function getList(params: GetListParams) {
    return {
      query: createGetListQuery(),
      variables: createGetListVariables(params),
      parseResponse: (response: Response) => {
        const { nodes, totalCount } = response.data[pluralizedQueryTypeName]
        return {
          data: nodes.map(prepareForReactAdmin),
          total: totalCount,
        }
      },
    }
  }

  function create(params: CreateParams) {
    return {
      query: gql`mutation create${typeName}($input: Create${typeName}Input!) {
          create${typeName} (
          input: $input
      ) {
        ${queryTypeName} {
        ${createQueryFromType(
          typeName,
          mappedIntrospection.types,
          allowedComplexTypes,
        )}
      }}}`,
      variables: {
        input: {
          [queryTypeName]: mapInputToVariables(
            params.data,
            mappedIntrospection.types[`${typeName}Input`],
            type,
            queryValueToInputValueMap,
          ),
        },
      },
      parseResponse: (response: Response) => ({
        data: prepareForReactAdmin(
          response.data[`create${typeName}`][queryTypeName],
        ),
      }),
    }
  }

  const updateResourceName = hasCompoundKey
    ? `update${typeName}ByNodeId`
    : `update${typeName}`

  const updateResourceInputName = capitalize(`${updateResourceName}Input`)

  const prepareDataForUpdate = hasCompoundKey
    ? (data: any) => ({
        ...data,
        nodeId: data.id,
        id: data.__rawId,
      })
    : (data: any) => {
        return data
      }

  function update(params: UpdateParams) {
    const preparedData = prepareDataForUpdate(params.data)
    return {
      query: gql`
        mutation ${updateResourceName}($input: ${updateResourceInputName}!) {
            ${updateResourceName}(input: $input) {
            ${queryTypeName} {
            ${createQueryFromType(
              typeName,
              mappedIntrospection.types,
              allowedComplexTypes,
            )}
        }}}`,
      variables: {
        input: {
          id: convertType(params.id),
          patch: mapInputToVariables(
            preparedData,
            mappedIntrospection.types[`${typeName}Patch`],
            type,
            queryValueToInputValueMap,
          ),
        },
      },
      parseResponse: (response: Response) => ({
        data: prepareForReactAdmin(
          response.data[updateResourceName][queryTypeName],
        ),
      }),
    }
  }

  function updateMany(params: UpdateManyParams) {
    const { ids, data } = params
    const inputs = ids.map(id => {
      return {
        id: convertType(id),
        clientMutationId: String(id),
        patch: mapInputToVariables(
          data,
          mappedIntrospection.types[`${typeName}Patch`],
          type,
          queryValueToInputValueMap,
        ),
      }
    })
    return {
      query: gql`mutation updateMany${typeName}(
      ${ids.map(id => `$arg${id}: ${updateResourceInputName}!`).join(',')}) {
          ${inputs.map(input => {
            return `
           update${input.id}:${updateResourceName}(input: $arg${input.id}) {
             clientMutationId
           }
          `
          })}
      }`,
      variables: inputs.reduce(
        (next, input) => ({ [`arg${input.id}`]: input, ...next }),
        {},
      ),
      parseResponse: (response: Response) => ({
        data: ids.map(id =>
          convertType(response.data[`update${id}`].clientMutationId),
        ),
      }),
    }
  }

  function getManyReference(params: GetManyReferenceParams) {
    const { target, id, filter } = params
    return {
      query: createGetListQuery(),
      variables: createGetListVariables({
        ...params,
        filter: {
          ...filter,
          [target]: id,
        },
      }),
      parseResponse: (response: Response) => {
        const { nodes, totalCount } = response.data[pluralizedQueryTypeName]
        return {
          data: nodes.map(prepareForReactAdmin),
          total: totalCount,
        }
      },
    }
  }

  const fetchTypes: FetchFNMap = {
    [GET_ONE]: getOne,
    [GET_MANY]: getMany,
    [GET_LIST]: getList,
    [CREATE]: create,
    [UPDATE]: update,
    [UPDATE_MANY]: updateMany,
    [GET_MANY_REFERENCE]: getManyReference,
  }

  return (raFetchType: string, params: Record<string, any>) => {
    const throwError = () => {
      throw new Error(
        `${raFetchType} is not implemented for type "${resourceName}"`,
      )
    }
    return (fetchTypes[raFetchType] || throwError)(params)
  }
}
