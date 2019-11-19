import get from 'lodash/get'
import { CAMEL_REGEX, QueryInputTypeMapper, GQLType } from './types'

export const capitalize = (str: string): string =>
  str[0].toUpperCase() + str.slice(1)
export const lowercase = (str: string): string =>
  str[0].toLowerCase() + str.slice(1)

export const snake = (camelCaseInput: string): string =>
  camelCaseInput.replace(CAMEL_REGEX, '$1_$2')

export const createSortingKey = (field: string, order: string): string => {
  return `${snake(field).toUpperCase()}_${order}`
}

export const fieldIsObjectOrListOfObject = (field: GQLType): boolean =>
  field.type.kind === 'OBJECT' ||
  (field.type.ofType &&
    (field.type.ofType.kind === 'OBJECT' || field.type.ofType.kind === 'LIST'))

// Maps any input object to variables of a mutation. Passes certain types
// through a mapping process.
export const mapInputToVariables = (
  input: any,
  inputType: any,
  type: GQLType,
  typeMapper: QueryInputTypeMapper,
): any => {
  const { inputFields } = inputType
  return inputFields.reduce((current: any, next: any) => {
    const key = next.name
    if (input[key] === undefined) {
      return current
    }
    const fieldType = type.fields.find((field: GQLType) => field.name === key)
    if (fieldType) {
      const fieldTypeName =
        get(fieldType, 'type.ofType.name') || get(fieldType, 'type.name')
      if (fieldTypeName) {
        const valueMapperForType = typeMapper[fieldTypeName]
        if (valueMapperForType) {
          const fieldIsList = fieldType.type.kind === 'LIST'
          const value = input[key]
          if (fieldIsList) {
            return {
              ...current,
              [key]: value && value.map(valueMapperForType),
            }
          }
          return {
            ...current,
            [key]: valueMapperForType(value),
          }
        }
      }
    }
    return {
      ...current,
      [key]: input[key],
    }
  }, {})
}

type GQLTypeMap = {
  [key: string]: GQLType
}

export const createTypeMap = (types: Array<GQLType>): GQLTypeMap => {
  return types.reduce((map: any, next: any) => {
    return {
      ...map,
      [next.name]: next,
    }
  }, {})
}

/**
 * Create a query list for all properties of a type
 *
 */
export const createQueryFromType = (
  type: string,
  typeMap: GQLTypeMap,
  allowedTypes: Array<string>,
): string => {
  const typeFields = get(typeMap, [type, 'fields'])
  if (!typeFields) {
    return ''
  }
  return typeFields.reduce((current: any, field: any) => {
    if (fieldIsObjectOrListOfObject(field)) {
      const subType =
        field.type.ofType &&
        // We also handle cases where we have e.g. [TYPE!] (List of type)
        (field.type.ofType.name ? field.type.ofType : field.type.ofType.ofType)
      const typeName = (subType && subType.name) || field.type.name
      if (typeName && allowedTypes.indexOf(typeName) !== -1) {
        return `${current} ${field.name} {${createQueryFromType(
          typeName,
          typeMap,
          allowedTypes,
        )} }`
      }
      if (!subType || subType.kind !== 'ENUM') {
        return current
      }
    }
    return `${current} ${field.name}`
  }, '')
}
