import { get } from 'lodash'
import {
  GQLType,
  GQLQueryProperties,
  FieldHandler,
  FieldHandlers,
  QueryFromTypeParams,
} from './types'
import { fieldType } from './gqltype'

function prepareArgString(fieldArguments: string | undefined): string {
  return (fieldArguments && `(${fieldArguments})`) || ''
}
/**
 * The ObjectField can be used for list of objects and for pure object fields.
 *
 * Renders nothing if the field has not type otherwise:
 *
 * <field.name> {
 *   <all fields of the type>
 * }
 */
export const ObjectField = (
  field: GQLType,
  fieldArguments: string | undefined,
  params: QueryFromTypeParams,
) => {
  const { typeMap } = params
  const nodeType = fieldType(field, typeMap)
  if (!nodeType) {
    return ''
  }
  const argString = prepareArgString(fieldArguments)
  return `${field.name}${argString} { ${createQueryFromType({
    ...params,
    typeName: nodeType.name,
  })} }`
}

/**
 * A field handler for all field types.
 *
 * The field is rendered if params.settings evaluates to true.
 * It is rendered as an object field if the params.settings is not boolean.
 */
export const SimpleFieldHandler = (
  field: GQLType,
  fieldArguments: string | undefined,
  params: QueryFromTypeParams,
): string => {
  const { settings } = params
  if (!settings) {
    // not enabled
    return ''
  }
  if (settings === true) {
    // render as a simple field with arguments
    const argString = prepareArgString(fieldArguments)
    return `${field.name}${argString}`
  }
  return ObjectField(field, fieldArguments, params)
}

export const SimpleFieldHandlers = {
  __default: SimpleFieldHandler,
} as FieldHandlers

export const createQueryFromType = (params: QueryFromTypeParams): string => {
  const { typeName, typeMap, handlers, settings } = params
  const typeFields: GQLType[] = get(typeMap, [typeName, 'fields'])
  if (!typeFields) {
    return ''
  }
  const defaultHandler: FieldHandler | undefined = get(handlers, '__default')

  const typeFieldsMap: { [fieldName: string]: GQLType } = typeFields.reduce(
    (current: any | undefined, field: GQLType) => {
      current[field.name] = field
      return current
    },
    {},
  )
  const sortedKeys: string[] = Object.keys(settings || {}).sort()
  return sortedKeys.reduce((current: string, fieldName: string) => {
    let setting: GQLQueryProperties | boolean | undefined = get(
      settings,
      fieldName,
    )

    let aliasName = ''
    let fieldArguments: string | undefined
    if (fieldName.startsWith('=')) {
      // fields starting with = are treated as alias fields for query with possible arguments
      aliasName = fieldName.substr(1)
      fieldArguments = get(setting, 'arguments')
      const query = get(setting, 'query')
      fieldName = Object.keys(query || {})[0]
      setting = query[fieldName]
    }
    // check if field is available in gql schema
    if (fieldName in typeFieldsMap) {
      const handler: FieldHandler | undefined = get(
        handlers,
        fieldName,
        defaultHandler,
      )
      if (handler) {
        const fieldQuery = handler(typeFieldsMap[fieldName], fieldArguments, {
          ...params,
          settings: setting,
        })
        if (fieldQuery && fieldQuery !== '') {
          const alias = (aliasName && `${aliasName}: `) || ''
          return `${current} ${alias}${fieldQuery}`
        }
      }
    }
    return current
  }, '')
}
