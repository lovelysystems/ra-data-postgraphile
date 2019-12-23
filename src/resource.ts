import get from 'lodash/get'
import gql from 'graphql-tag'
import {
  GET_LIST,
  GET_ONE,
  GET_MANY,
  CREATE,
  UPDATE,
  UPDATE_MANY,
  DELETE,
  GET_MANY_REFERENCE,
  GetOneParams,
  GetManyParams,
  GetManyReferenceParams,
  UpdateParams,
  UpdateManyParams,
  DeleteParams,
  CreateParams,
  GetListParams,
  LegacyDataProvider,
} from 'ra-core'
import {
  capitalize,
  lowercase,
  createTypeMap,
  createSortingKey,
} from './utils'
import {
  createQueryFromType,
  SimpleFieldHandlers,
} from './field'
import { createFilter } from './filters'
import {
  NATURAL_SORTING,
  RADataGraphqlFactory,
  ResourceOptions,
  Response,
  MappedIntrospectionResult,
  IntrospectedTypes,
  TypeFilterMapping,
  GQLType,
  GQLVariables,
  GQLQuerySettings,
  FieldHandlers,
  QueryVariableTypeMappers,
  QueryVariableTypeMapper,
  IResource,
} from './types'

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

/**
 * The resource factory called from ra-data-graphgql
 */
export default (
  introspectionResults: IntrospectionResult,
  factory: RADataGraphqlFactory,
): LegacyDataProvider => {
  const mappedIntrospection: MappedIntrospectionResult = {
    ...introspectionResults,
    types: createTypeMap(introspectionResults.types),
    queries: createTypeMap(introspectionResults.queries),
  }
  const resources: { [key: string]: IResource } = {}
  const { options } = factory
  return (
    raFetchType: string,
    resourceName: string,
    params: Record<string, any>,
  ): Promise<any> => {
    let resource = resources[resourceName]
    if (!resource) {
      const resourceOptions = get(
        options,
        ['resources', resourceName],
      )
      const resourceClass = resourceOptions.resourceClass || BaseResource
      resource = new resourceClass(
        mappedIntrospection,
        resourceName,
        resourceOptions,
      )
      resources[resourceName] = resource
    }
    return resource.fetch(raFetchType, params)
  }
}

/**
 * The generic resource implementation
 *
 * This implementation works based on the introspection results and allows to
 * use postgraphile types without any additional programming.
 */
export class BaseResource implements IResource {

  public resourceName: string
  public typeName: string
  public queryTypeName: string
  public pluralizedName: string
  public pluralizedQueryTypeName: string
  public pluralizedTypeName: string

  public hasCompoundKey: boolean = false
  public prepareForReactAdmin: any

  public getOneResourceName: string
  public getOneIdType: string
  public getOneArgs: string
  public getOneParams: string

  public getManyArgs: string
  public getManyFilter: string

  public updateResourceName: string
  public updateResourceInputName: string
  public prepareDataForUpdate: (data: any) => any

  public deleteResourceName: string
  public deleteResourceInputName: string

  public introspection: IntrospectedTypes & MappedIntrospectionResult

  public raActionMap: any

  public idConverter: (data: any) => any

  public valueToQueryVariablesMap: QueryVariableTypeMappers | null = null
  public typeToFilterMap: TypeFilterMapping | null = null
  public queryFieldHandlers?: FieldHandlers = SimpleFieldHandlers
  public querySettings: GQLQuerySettings = {}

  constructor(
    mappedIntrospection: MappedIntrospectionResult,
    resourceName: string,
    options: ResourceOptions,
  ) {
    this.resourceName = resourceName
    this.typeName = capitalize(resourceName)
    this.queryTypeName = lowercase(resourceName)
    this.pluralizedName = options.pluralizedName || `${this.queryTypeName}s`
    this.pluralizedQueryTypeName = lowercase(this.pluralizedName)
    this.pluralizedTypeName = capitalize(this.pluralizedQueryTypeName)

    // The GQL Type definition
    this.introspection = {
      types: mappedIntrospection.types,
      queries: mappedIntrospection.queries,
      type: mappedIntrospection.types[this.typeName],
      inputType: mappedIntrospection.types[`${this.typeName}Input`],
      patchType: mappedIntrospection.types[`${this.typeName}Patch`],
      query: mappedIntrospection.queries[this.queryTypeName],
    }
    if (!this.introspection.type) {
      throw new Error(`Type "${this.typeName}" not found in introspection`)
    }
    if (!this.introspection.query) {
      throw new Error(
        `Query "${this.queryTypeName}" for type "${this.typeName}" not found in introspection`,
      )
    }
    
    // Getting the primary keys:
    //   The arguments for the query to get the resource (defined as lowercased
    //   resource name) are the fields defining the primary key of the resource.
    const primaryKeys = this.introspection.query.args
    if (!primaryKeys || primaryKeys.length === 0) {
      throw new Error(
        `Query "${this.queryTypeName}" for type "${this.typeName}" has no args`,
      )
    }
    this.hasCompoundKey = primaryKeys.length > 1
    
    this.prepareForReactAdmin = this.hasCompoundKey
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

    this.getOneResourceName = this.hasCompoundKey
      ? `${this.queryTypeName}ByNodeId`
      : this.queryTypeName
    this.getOneIdType = this.hasCompoundKey ? 'ID' : primaryKeys[0].type.ofType.name
    this.getOneArgs = `$id: ${this.getOneIdType}!`
    this.getOneParams = this.hasCompoundKey
      ? 'nodeId: $id'
      : `${primaryKeys[0].name}: $id`

    this.idConverter = gqlTypeConverter(this.getOneIdType)

    this.getManyArgs = `$ids: [${this.getOneIdType}!]`
    this.getManyFilter = this.hasCompoundKey
      ? '{ nodeId: { in: $ids }}'
      : `{ ${primaryKeys[0].name}: { in: $ids }}`

    this.updateResourceName = this.hasCompoundKey
      ? `update${this.typeName}ByNodeId`
      : `update${this.typeName}`
    this.updateResourceInputName = capitalize(`${this.updateResourceName}Input`)
    this.prepareDataForUpdate = this.hasCompoundKey
      ? (data: any) => ({
          ...data,
          nodeId: data.id,
          id: data.__rawId,
        })
      : (data: any) => {
          return data
        }

    this.deleteResourceName = this.hasCompoundKey
      ? `delete${this.typeName}ByNodeId`
      : `delete${this.typeName}`
    this.deleteResourceInputName = capitalize(`${this.deleteResourceName}Input`)

    this.queryFieldHandlers = get(options, 'queryFieldHandlers', SimpleFieldHandlers)
    this.querySettings = get(options, 'querySettings', {})
  }

  getOne = (params: GetOneParams) => {
    return {
      query: gql`query ${this.getOneResourceName}(${this.getOneArgs}) {
        ${this.getOneResourceName}(${this.getOneParams}) {
        ${this.createQueryFromType(GET_ONE)}
      }}`,
      variables: { id: this.idConverter(params.id) },
      parseResponse: (response: Response) => {
        return {
          data: this.prepareForReactAdmin(
            response.data[this.getOneResourceName],
          ),
        }
      },
    }
  }

  getMany = (params: GetManyParams) => {
    return {
      query: gql`query ${this.pluralizedQueryTypeName}(${this.getManyArgs}) {
        ${this.pluralizedQueryTypeName}(filter: ${this.getManyFilter}) {
          nodes {
            ${this.createQueryFromType(GET_ONE)}
          }
      }}`,
      variables: {
        ids: params.ids.filter(v => Boolean(v)).map(this.idConverter),
      },
      parseResponse: (response: Response) => {
        const { nodes } = response.data[this.pluralizedQueryTypeName]
        return {
          data: nodes.map(this.prepareForReactAdmin),
        }
      },
    }
  }

  getList = (params: GetListParams) => {
    return {
      query: this.createGetListQuery(),
      variables: this.createGetListVariables(params),
      parseResponse: (response: Response) => {
        const { nodes, totalCount } = response.data[this.pluralizedQueryTypeName]
        return {
          data: nodes.map(this.prepareForReactAdmin),
          total: totalCount,
        }
      },
    }
  }

  create = (params: CreateParams) => {
    return {
      query: gql`mutation create${this.typeName}($input: Create${this.typeName}Input!) {
          create${this.typeName} (
          input: $input
      ) {
        ${this.queryTypeName} {
        ${this.createQueryFromType(CREATE)}
      }}}`,
      variables: {
        input: {
          [this.queryTypeName]: this.recordToVariables(
            params.data,
            this.introspection.inputType,
          ),
        },
      },
      parseResponse: (response: Response) => ({
        data: this.prepareForReactAdmin(
          response.data[`create${this.typeName}`][this.queryTypeName],
        ),
      }),
    }
  }

  update = (params: UpdateParams) => {
    const preparedData = this.prepareDataForUpdate(params.data)
    return {
      query: gql`
        mutation ${this.updateResourceName}($input: ${this.updateResourceInputName}!) {
          ${this.updateResourceName}(input: $input) {
          ${this.queryTypeName} {
          ${this.createQueryFromType(UPDATE)}
        }}}`,
      variables: {
        input: {
          id: this.idConverter(params.id),
          patch: this.recordToVariables(
            preparedData,
            this.introspection.patchType,
          ),
        },
      },
      parseResponse: (response: Response) => ({
        data: this.prepareForReactAdmin(
          response.data[this.updateResourceName][this.queryTypeName],
        ),
      }),
    }
  }

  updateMany = (params: UpdateManyParams) => {
    const { ids, data } = params
    const inputs = ids.map(id => {
      return {
        id: this.idConverter(id),
        clientMutationId: String(id),
        patch: this.recordToVariables(
          data,
          this.introspection.patchType,
        ),
      }
    })
    return {
      query: gql`mutation updateMany${this.typeName}(
      ${ids.map(id => `$arg${id}: ${this.updateResourceInputName}!`).join(',')}) {
          ${inputs.map(input => {
            return `
           update${input.id}:${this.updateResourceName}(input: $arg${input.id}) {
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
          this.idConverter(response.data[`update${id}`].clientMutationId),
        ),
      }),
    }
  }

  deleteOne = (params: DeleteParams) => {
    return {
      query: gql`mutation ${this.deleteResourceName}($input: ${this.deleteResourceInputName}!) {
        ${this.deleteResourceName}(input: $input) {
        ${this.queryTypeName} {
        ${this.createQueryFromType(DELETE)}
      }}}`,
      variables: {input: {
        id: this.idConverter(params.id),
      }},
      parseResponse: (response: Response) => {
        return {
          data: this.prepareForReactAdmin(
            response.data[this.deleteResourceName][this.queryTypeName],
          ),
        }
      },
    }
  }

  getManyReference = (params: GetManyReferenceParams) => {
    const { target, id, filter } = params
    return {
      query: this.createGetListQuery(),
      variables: this.createGetListVariables({
        ...params,
        filter: {
          ...filter,
          [target]: id,
        },
      }),
      parseResponse: (response: Response) => {
        const { nodes, totalCount } = response.data[this.pluralizedQueryTypeName]
        return {
          data: nodes.map(this.prepareForReactAdmin),
          total: totalCount,
        }
      },
    }
  }

  createQueryFromType = (forQuery: string) => {
    return createQueryFromType({
      typeName: this.typeName,
      typeMap: this.introspection.types,
      handlers: this.queryFieldHandlers,
      settings: this.querySettings[forQuery],
    })
  }
 
  createGetListQuery = () => {
    return gql`query ${this.pluralizedQueryTypeName} (
      $offset: Int!,
      $first: Int!,
      $filter: ${this.typeName}Filter,
      $orderBy: [${this.pluralizedTypeName}OrderBy!]
      ) {
          ${this.pluralizedQueryTypeName}(
            first: $first, offset: $offset, filter: $filter, orderBy: $orderBy
          ) {
          nodes {
            ${this.createQueryFromType('GET_LIST')}
          }
          totalCount
    }}`
  }

  createGetListVariables = (params: GetListParams) => {
    const { filter, sort, pagination } = params
    const orderBy = sort
      ? [createSortingKey(sort.field, sort.order)]
      : [NATURAL_SORTING]
    const filters = createFilter(
      filter,
      this.introspection.type,
      this.typeToFilterMap,
    )
    return {
      offset: (pagination.page - 1) * pagination.perPage,
      first: pagination.perPage,
      filter: filters,
      orderBy,
    }
  }

  hasQuery = (typeName: string): boolean => {
    return !!this.introspection.queries[typeName]
  }

  /**
   * The fetch method called from ra-data-graphql
   */
  fetch = (raFetchType: string, params: any) => {
    const throwError = () => {
      throw new Error(
        `${raFetchType} is not implemented for type "${this.resourceName}"`,
      )
    }
    switch (raFetchType) {
      case GET_ONE: return this.getOne(params)
      case GET_MANY: return this.getMany(params)
      case GET_MANY_REFERENCE: return this.getManyReference(params)
      case GET_LIST: return this.getList(params)
      case CREATE:
        return this.hasQuery(`create${this.typeName}`)
          ? this.create(params)
          : throwError()
      case UPDATE:
        return this.hasQuery(this.updateResourceName)
          ? this.update(params)
          : throwError()
      case UPDATE_MANY:
        return this.hasQuery(this.updateResourceName)
          ? this.updateMany(params)
          : throwError()
      case DELETE:
        return this.hasQuery(`delete${this.typeName}`)
          ? this.deleteOne(params)
          : throwError()
      default: throwError()
    }
  }

  /**
   * Create a variables list based on a GQL input type
   *
   * The output can then be used as parameters for graphql.
   */
  recordToVariables = (
    input: any,
    inputType: GQLType,
  ): GQLVariables | null => {
    const { inputFields } = inputType
    if (!inputFields) {
      // not an input type
      return null
    }
    const typeMapper: QueryVariableTypeMappers | null = this.valueToQueryVariablesMap
    const resourceType = this.introspection.type

    return inputFields.reduce((current: any, next: any) => {
      const inputName = next.name
      if (input[inputName] === undefined) {
        // not contained in the input
        return current
      }
      if (typeMapper) {
        const fieldType = resourceType.fields.find((field: GQLType) => field.name === inputName)
        if (fieldType) {
          const fieldTypeName =
            get(fieldType, 'type.ofType.name') || get(fieldType, 'type.name')
          if (fieldTypeName) {
            const valueMapperForType: QueryVariableTypeMapper = typeMapper[fieldTypeName]
            if (valueMapperForType) {
              const fieldIsList = fieldType.type.kind === 'LIST'
              const value = input[inputName]
              if (fieldIsList) {
                return {
                  ...current,
                  [inputName]: value && value.map(valueMapperForType),
                }
              }
              return {
                ...current,
                [inputName]: valueMapperForType(value),
              }
            }
          }
        }
      }
      return {
        ...current,
        [inputName]: input[inputName],
      }
    }, {})
  }

}
