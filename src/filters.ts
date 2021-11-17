import tsquery from 'pg-tsquery'
import { GQLType, FilterFields, TypeFilterMapping } from './types'
import { createSortingKey } from './utils'

const AVOID_ASTERISK_REGEX = /(\||<->|:\*|!)/
const PRO_AND_REGEX = /\W(&|and)\W/i
const QUOTED_REGEX = /"\w*"|'\w*'/i

const normalizeStringList = (value: string) =>
  value
    ?.split(',')
    .map(v => v.trim())
    .filter(v => v)

/**
 * Map query filter operations to backend filter names
 *
 * By using a type and an operation this mapping allows to build the filter
 * parameters for postgraphile.
 */
export const TYPE_TO_FILTER_MAPPINGS = {
  String: {
    '=': ['equalTo'],
    '!=': ['notEqualTo'],
    null: ['isNull', () => true],
    '!null': ['isNull', () => false],
    likeInsensitive: ['likeInsensitive', (value: string) => `%${value}%`],
    default: ['likeInsensitive', (value: string) => `%${value}%`],
  },
  StringList: {
    '=': ['equalTo', normalizeStringList],
    contains: ['contains', normalizeStringList],
    containedBy: ['containedBy', normalizeStringList],
    default: ['equalTo', normalizeStringList],
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
    null: ['isNull', () => true],
    '!null': ['isNull', () => false],
    in: ['in', (value: number[]) => value.map(Number)],
    '!in': ['notIn', (value: number[]) => value.map(Number)],
    default: ['equalTo', Number],
  },
  get BigInt() {
    return this.Int
  },
  IntArray: {
    '=': ['in', (value: string[]) => value.map(Number)],
    '!=': ['notIn', (value: string[]) => value.map(Number)],
    in: ['in', (value: string[]) => value.map(Number)],
    '!in': ['notIn', (value: string[]) => value.map(Number)],
    default: ['in', (value: string[]) => value.map(Number)],
  },
  get BigIntArray() {
    return this.IntArray
  },
  IntList: {
    '=': ['anyEqualTo', Number],
    '!=': ['anyNotEqualTo', Number],
    anyEqualTo: ['anyEqualTo', Number],
    anyNotEqualTo: ['anyNotEqualTo', Number],
    default: ['anyEqualTo', Number],
  },
  IntListArray: {
    '=': ['equalTo', (value: string[]) => value.map(Number)],
    '!=': ['notEqualTo', (value: string[]) => value.map(Number)],
    overlaps: ['overlaps', (value: string[]) => value.map(Number)],
    contains: ['contains', (value: string[]) => value.map(Number)],
    containedBy: ['containedBy', (value: string[]) => value.map(Number)],
    distinctFrom: ['distinctFrom', (value: string[]) => value.map(Number)],
    notDistinctFrom: [
      'notDistinctFrom',
      (value: string[]) => value.map(Number),
    ],
    default: ['overlaps', (value: string[]) => value.map(Number)],
  },
  ENUM: {
    '=': ['equalTo'],
    '!=': ['notEqualTo'],
    null: ['isNull', () => true],
    '!null': ['isNull', () => false],
    default: ['equalTo'],
  },
  ENUMArray: {
    '=': ['in'],
    '!=': ['notIn'],
    in: ['in'],
    '!in': ['notIn'],
    default: ['in'],
  },
  Datetime: {
    '=': ['equalTo', (value: Date) => value.toISOString()],
    '!=': ['notEqualTo', (value: Date) => value.toISOString()],
    '<': ['lessThan', (value: Date) => value.toISOString()],
    '<=': ['lessThanOrEqualTo', (value: Date) => value.toISOString()],
    '>': ['greaterThan', (value: Date) => value.toISOString()],
    '>=': ['greaterThanOrEqualTo', (value: Date) => value.toISOString()],
    null: ['isNull', () => true],
    '!null': ['isNull', () => false],
    default: ['equalTo', (value: Date) => value.toISOString()],
  },
  FullText: {
    '=': ['matches'],
    default: [
      'matches',
      (value: string) => {
        const parser = new (tsquery as any).Tsquery()
        const node = parser.parse(value)
        if (!node) {
          // some strings can not be parsed by lib - query original string
          return value
        }
        const parsed = node.toString()
        // use original query string on explicit and/or/negated queries
        if (parsed.match(AVOID_ASTERISK_REGEX) || value.match(PRO_AND_REGEX)) {
          return value
        }
        // append asterisks on each term except quoted terms
        return parsed
          .split('&')
          .map((v: string) => {
            if (v.match(QUOTED_REGEX)) {
              return v
            }
            if (v.startsWith("'")) {
              // terms starting with ' but not ending would lead
              // to syntax error in tsquery
              return v.substr(1)
            }
            return `${v}*`
          })
          .join(' ')
      },
    ],
  },
} as TypeFilterMapping

const getTypeName = (filter: TypeFilterMapping, type: GQLType, value: any) => {
  // use different type names in case the provided value is an array
  // First try to find a mapping for the type name (e.g. String).
  let typeName = Array.isArray(value) ? `${type.name}Array` : type.name
  if (!filter[typeName]) {
    // Try to get a mapping for the kind (e.g. ENUM)
    typeName = Array.isArray(value) ? `${type.kind}Array` : type.kind
  }
  return typeName
}

export const mapFilterType = (
  type: GQLType,
  value: any,
  operations: string[],
  typeToFilter: TypeFilterMapping | undefined | null = undefined,
): any => {
  // use the provided filter mappings or the integrated
  const filter = typeToFilter || TYPE_TO_FILTER_MAPPINGS
  const typeName = getTypeName(filter, type, value)
  if (!filter[typeName]) {
    throw new Error(
      `Filter for type "${type.name}" or kind "${type.kind}" not implemented.`,
    )
  }
  let operation = 'default'
  if (operations.length > 0) {
    ;[operation] = operations
  }
  const [operator, transformator = (v: any) => v] = filter[typeName][
    operation
  ] || [null]
  if (!operator) {
    throw new Error(
      `Operation "${operation}" for type "${typeName}" not implemented.`,
    )
  }
  return {
    [operator]: transformator(value),
  }
}

const ORDER_BY_TYPES: Record<string, (key: string, value?: any) => string> = {
  FullText: (key: string) => createSortingKey(`${key}Rank`, 'DESC'),
}

const getOrderBy = (
  key: string,
  type: GQLType,
  value: any,
  typeToFilter: TypeFilterMapping | undefined | null = undefined,
) => {
  const filter = typeToFilter || TYPE_TO_FILTER_MAPPINGS
  const typeName = getTypeName(filter, type, value)
  const orderByFunc = ORDER_BY_TYPES[typeName]
  if (orderByFunc) {
    return orderByFunc(key, value)
  }
  return undefined
}

export const createFilter = (
  fields: FilterFields,
  type: GQLType,
  typeToFilter?: TypeFilterMapping | null | undefined,
): {
  filters?: Record<string, unknown>
  filterOrderBy: string[]
} => {
  if (!fields) {
    return { filters: undefined, filterOrderBy: [] }
  }
  const empty = {}
  const orderBys: string[] = []
  const filters = Object.keys(fields).reduce(
    (next: Record<string, unknown>, key: string) => {
      const [name, ...operations] = getFilterParameters(key)
      const maybeType = type.fields.find((f: GQLType) => f.name === name)
      if (maybeType) {
        let subType = maybeType.type.ofType || maybeType.type

        if (maybeType.type.kind === 'LIST') {
          subType = { ...subType, name: `${maybeType.type.ofType.name}List` }
        }
        const value = fields[key]
        const orderBy = getOrderBy(key, subType, value, typeToFilter)
        if (orderBy) {
          orderBys.push(orderBy)
        }
        const f = mapFilterType(subType, fields[key], operations, typeToFilter)
        const exists: any = next[name]
        if (exists) {
          return {
            ...next,
            [name]: { ...exists, ...f },
          }
        }
        return {
          ...next,
          [name]: f,
        }
      }
      return next
    },
    empty,
  )
  if (filters === empty) {
    return { filters: undefined, filterOrderBy: [] }
  }
  return {
    filters: { and: [filters] },
    filterOrderBy: orderBys,
  }
}

export const getFilterParameters = (name: string): string[] => {
  return name.split(' ')
}
