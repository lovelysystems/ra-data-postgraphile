import { GQLType, GQLTypeMap } from './types'

export const isListType = (field: GQLType): boolean =>
  field.kind === 'LIST' || (field.ofType && field.ofType.kind === 'LIST')

export const isObjectType = (field: GQLType): boolean =>
  field.kind === 'OBJECT' || (field.ofType && field.ofType.kind === 'OBJECT')

export const hasKind = (kind: string, field: GQLType): boolean => {
  if (!field || !field.type) {
    return false
  }
  let current = field.type
  while (current && current.kind !== kind) {
    current = current.ofType
  }
  return !!current
}

/**
 * Checks if the field is an object or a list of objects
 *
 * We only need to check if the type chain contains an object type.
 */
export const isObjectOrListOfObjectsType = (field: GQLType): boolean =>
  hasKind('OBJECT', field)

/**
 * Get the type name for a field
 *
 * The type is requested via the type field.
 * A type
 */
export const fieldTypeName = (field: GQLType): string | null => {
  if (!field || !field.type || (!field.type.name && !field.type.ofType)) {
    return null
  }
  if (field.type.name) {
    // type is directly provided
    return field.type.name
  }
  // Search down the ofType properties to find a type with a name.
  // The search is needed because the final type can be nested in a NON_NULL
  // and LIST type.
  let current = field.type.ofType
  while (current && !current.name) {
    current = current.ofType
  }
  return current.name
}

/**
 * Provide the GQLType for the typeName of a type.
 */
export const fieldType = (
  field: GQLType,
  typeMap: GQLTypeMap,
): GQLType | null => {
  const typeName = fieldTypeName(field)
  if (!typeName) {
    return null
  }
  return typeMap[typeName]
}
