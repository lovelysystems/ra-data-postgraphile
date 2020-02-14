import { GQLType, FilterFields, TypeFilterMapping } from './types'

/**
 * Map query filter operations to backend filter names
 *
 * By using a type an an operation this mapping allows to build the filter
 * parameters for postgraphile.
 */
export const TYPE_TO_FILTER_MAPPINGS = {
  String: {
    '=': ['equalTo'],
    '!=': ['notEqualTo'],
    'null': ['isNull', () => true],
    '!null': ['isNull', () => false],
    likeInsensitive: ['likeInsensitive', (value: string) => `%${value}%`],
    default: ['likeInsensitive', (value: string) => `%${value}%`],
  },
  Boolean: {
    '=': ['equalTo'],
    '!=': ['notEqualTo'],
    default: ['equalTo'],
  },
  Int: {
    '=': ['equalTo', Number],
    '!=': ['notEqualTo', Number],
    '<': ['lessThan', Number],
    '<=': ['lessThanOrEqualTo', Number],
    '>': ['greaterThan', Number],
    '>=': ['greaterThanOrEqualTo', Number],
    'null': ['isNull', () => true],
    '!null': ['isNull', () => false],
    default: ['equalTo', Number],
  },
  IntArray: {
    '=': ['in', (value: string[]) => value.map(Number)],
    "!=": ['notIn', (value: string[]) => value.map(Number)],
    'in': ['in', (value: string[]) => value.map(Number)],
    "!in": ['notIn', (value: string[]) => value.map(Number)],
    default: ['in', (value: string[]) => value.map(Number)],
  },
  IntList: {
    // XXX use = and != or better the explicit methods or both? i'd go for only explicit
    '=': ['anyEqualTo', Number],
    "!=": ['anyNotEqualTo', Number],
    "anyEqualTo": ['anyEqualTo', Number],
    "anyNotEqualTo": ['anyNotEqualTo', Number],
    default: ['anyEqualTo', Number],
  },
  IntListArray: {
    '=': ['equalTo', (value: string[]) => value.map(Number)],
    "!=": ['notEqualTo', (value: string[]) => value.map(Number)],
    "overlaps": ['overlaps', (value: string[]) => value.map(Number)],
    "contains": ['contains', (value: string[]) => value.map(Number)],
    "containedBy": ['containedBy', (value: string[]) => value.map(Number)],
    "distinctFrom": ['distinctFrom', (value: string[]) => value.map(Number)],
    "notDistinctFrom": ['notDistinctFrom', (value: string[]) => value.map(Number)],
    default: ['overlaps', (value: string[]) => value.map(Number)],
  },
  ENUM: {
    '=': ['equalTo'],
    '!=': ['notEqualTo'],
    'null': ['isNull', () => true],
    '!null': ['isNull', () => false],
    default: ['equalTo'],
  },
  ENUMArray: {
    "=": ['in'],
    '!=': ['notIn'],
    'in': ['in'],
    '!in': ['notIn'],
    default: ['in'],
  },
} as TypeFilterMapping

export const mapFilterType = (
  type: GQLType,
  value: any,
  operations: string[],
  typeToFilter: TypeFilterMapping | undefined | null,
): any => {
  // use the provided filter mappings or the integrated
  const filter = typeToFilter || TYPE_TO_FILTER_MAPPINGS
  // use different type names in case the provided value is an array
  // First try to find a mapping for the type name (e.g. String).

  // XXX it's not optimal that the type array is only recognized when the value is an array.
  // IntListFilter also support integers as arguments for filters eg {anyEqualTo: Int}

  let typeName = Array.isArray(value) ? `${type.name}Array` : type.name
  if (!filter[typeName]) {
    // Try to get a mapping for the kind (e.g. ENUM)
    typeName = Array.isArray(value) ? `${type.kind}Array` : type.kind
  }
  if (!filter[typeName]) {
    throw new Error(`Filter for type "${type.name}" or kind "${type.kind}" not implemented.`)
  }
  let operation = 'default'
  if (operations.length > 0) {
    operation = operations[0]
  }
  const [operator, transformator = (v: any) => v] = filter[typeName][operation] || [null]
  if (!operator) {
    throw new Error(`Operation "${operation}" for type "${typeName}" not implemented.`)
  }
  return {
    [operator]: transformator(value)
  }
}

export const createFilter = (
  fields: FilterFields,
  type: GQLType,
  typeToFilter: TypeFilterMapping | null | undefined
): any => {
  if (!fields) {
    return undefined
  }
  const empty = {}
  const filters = Object.keys(fields).reduce((next, key: string) => {
    const [name, ...operations] = getFilterParameters(key)
    const maybeType = type.fields.find((f: GQLType) => f.name === name)
    if (maybeType) {
      const subType = maybeType.type.ofType || maybeType.type

      if (maybeType.type.kind === 'LIST') {
        subType.name = `${maybeType.type.ofType.name}List`
      }
      return {
        ...next,
        [name]: mapFilterType(subType, fields[key], operations, typeToFilter),
      }
    }
    return next
  }, empty)
  if (filters === empty) {
    return undefined
  }
  return { and: [filters] }
}

export const getFilterParameters = (name: string): string[] => {
  return name.split(' ')
}
