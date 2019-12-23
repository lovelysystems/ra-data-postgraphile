import get from 'lodash/get'
import {
  CAMEL_REGEX,
  QueryVariableTypeMappers,
  GQLType,
  GQLTypeMap,
} from './types'

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

type GQLVariables = {
  [key: string]: any
}

export const createTypeMap = (types: Array<GQLType>): GQLTypeMap => {
  return types.reduce((map: any, next: any) => {
    return {
      ...map,
      [next.name]: next,
    }
  }, {})
}
