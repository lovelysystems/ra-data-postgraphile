import {
  GET_LIST,
  GET_ONE,
  CREATE,
  UPDATE,
  DELETE,
  GetOneParams,
  GetManyParams,
  GetManyReferenceParams,
  UpdateParams,
  UpdateManyParams,
  DeleteParams,
  CreateParams,
  GetListParams,
} from 'ra-core'

export type QueryVariableTypeMapper = (
  value: Record<string, any>,
) => Record<string, any>

export type QueryVariableTypeMappers = {
  [key: string]: QueryVariableTypeMapper
}

export type GQLVariables = {
  [key: string]: any
}

// GQL Filter Value Handling

export type ValueMapper = (value: any) => any
export type TypeFilterMapping = {
  [key: string]: {
    [operation: string]: [string, ValueMapper?]
  }
}
export type CreateFilterFunction = (fields: FilterFields, type: GQLType) => any

export type FilterFields = {
  [key: string]: any
}

export type GQLTypeMap = {
  [key: string]: GQLType
}

export type GQLFieldSettings = {
  arguments?: string
}

export type GQLQueryProperties = {
  [propertyName: string]: boolean | GQLQueryProperties | GQLFieldSettings
}

export type GQLQuerySettings = {
  [queryType: string]: GQLQueryProperties
}

export type MappedIntrospectionResult = {
  types: GQLTypeMap
  queries: GQLTypeMap
}

export type IntrospectedTypes = {
  type: GQLType
  query: GQLType
  inputType: GQLType
  patchType: GQLType
}

/**
 * Resources
 *
 * Resources can be configured via the resource options in the definition of
 * react admin.
 */
export type ResourceFactory = (
  mappedIntrospection: MappedIntrospectionResult,
  resourceName: string,
  options: ProviderOptions,
) => any

export interface IResource {
  fetch(raFetchType: string, params: Record<string, any>): any
  getOne(params: GetOneParams): any
  getMany(params: GetManyParams): any
  getList(params: GetListParams): any
  create(params: CreateParams): any
  update(params: UpdateParams, options?: UpdateBuildOptions | null): any
  updateMany(params: UpdateManyParams): any
  deleteOne(params: DeleteParams): any
  getManyReference(params: GetManyReferenceParams): any
}

export interface BuildOptions {
  resultName: string | undefined
}

export type UpdateBuildOptions = BuildOptions

export interface IResourceConstrutor {
  new (
    mappedIntrospection: MappedIntrospectionResult,
    resourceName: string,
    options?: ResourceOptions,
  ): IResource
}

export type ResourceOptions = {
  // The pluralized name of the resource, this is needed if the pluralized name
  // of the resource not just ends with 's'.
  pluralizedName?: string

  // An optional class which implements IResource to be used as the resource
  // handler.
  resourceClass?: IResourceConstrutor

  // Optional field to overwrite the internal type mappings (see filter.ts)
  typeToFilterMap?: TypeFilterMapping
  // Optional field handlers to convert fields to queries
  queryFieldHandlers?: FieldHandlers
  // The query settings for the GQL results
  querySettings: GQLQuerySettings
  // Alternative resource name in the backend. If not given the name of the resource
  // is taken.
  backendResourceName: string
}

/**
 * The options which can be provided via react-admin resource options.
 */
export type ProviderOptions = {
  resources: {
    [name: string]: ResourceOptions
  }
}

export type RADataGraphqlFactory = {
  // Provided by ra-data-graphql as 'factory' parameter
  options: ProviderOptions
}

export type QueryFromTypeParams = {
  typeName: string
  typeMap: GQLTypeMap
  handlers?: FieldHandlers
  settings?: GQLQueryProperties | boolean
}

export type FieldHandler = (
  field: GQLType,
  fieldArguments: string | undefined,
  params: QueryFromTypeParams,
) => string

export interface FieldHandlers {
  [fieldName: string]: FieldHandler
}

/**
 * The GraphQL Introspection Types
 */
export interface GQLType {
  name: string
  kind: string
  fields: GQLType[]
  inputFields: GQLType[] | null
  args: any
  type: GQLType
  ofType: GQLType
  defaultValue: any
  description: string | null
}

export type Response = {
  data: any
}

export const CAMEL_REGEX = /(.+?)([A-Z])/gm

export const NATURAL_SORTING = 'NATURAL'
