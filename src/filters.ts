import { GQLType, FilterFields } from './types'

export const mapFilterType = (type: GQLType, value: any): any => {
  switch (type.name) {
    case 'String':
      return {
        likeInsensitive: `%${value}%`,
      }
    case 'Int':
      return Array.isArray(value)
        ? {
            in: value.map(Number),
          }
        : {
            equalTo: Number(value),
          }
    default:
      throw new Error(`Filter for type ${type.name} not implemented.`)
  }
}

export const createFilter = (fields: FilterFields, type: GQLType): any => {
  if (!fields) {
    return undefined
  }
  const empty = {}
  const filters = Object.keys(fields).reduce((next, key: string) => {
    const maybeType = type.fields.find((f: GQLType) => f.name === key)
    if (maybeType) {
      const subType = maybeType.type.ofType || maybeType.type
      return {
        ...next,
        [key]: mapFilterType(subType, fields[key]),
      }
    }
    return next
  }, empty)
  if (filters === empty) {
    return undefined
  }
  return { and: [filters] }
}
