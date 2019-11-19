export type QueryInputTypeMapper = {
  [key: string]: (value: Record<string, any>) => Record<string, any>
}
export type TypePluralizerMap = { [key: string]: string }

export type ProviderOptions = {
  /**
   * It's possible that a type has a different shape when a Query is used
   * then when the Input/Patch is used
   * */
  queryValueToInputValueMap?: QueryInputTypeMapper
  typePluralizer?: TypePluralizerMap
}

export type Factory = {
  options: ProviderOptions
}

export type FilterFields = {
  [key: string]: any
}

export type GQLType = {
  name: string
  kind: string
  fields: any // Map<string, GQLType>,
  type: GQLType
  ofType: GQLType
}

export type Response = {
  data: any
}

// Constants

export const NODE_INTERFACE = 'Node'

export const CAMEL_REGEX = /(.+?)([A-Z])/gm

export const NATURAL_SORTING = 'NATURAL'

export const VERB_GET_ONE = 'GET_ONE'
export const VERB_GET_MANY = 'GET_MANY'
export const VERB_GET_MANY_REFERENCE = 'GET_MANY_REFERENCE'
export const VERB_GET_LIST = 'GET_LIST'
export const VERB_CREATE = 'CREATE'
export const VERB_DELETE = 'DELETE'
export const VERB_DELETE_MANY = 'DELETE_MANY'
export const VERB_UPDATE = 'UPDATE'
export const VERB_UPDATE_MANY = 'UPDATE_MANY'
