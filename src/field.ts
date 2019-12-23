import get from 'lodash/get'
import {
  fieldIsObjectOrListOfObject,
} from './utils'
import {
  GQLType,
  GQLTypeMap,
  GQLQueryProperties,
  FieldHandler,
  FieldHandlers,
  QueryFromTypeParams,
} from './types'
import { isObjectOrListOfObjectsType, fieldType } from './gqltype'

/**
 * The ObjectField can be used for list of objects and for pure object fields.
 *
 * Renders nothing if the field has not type otherwise:
 *
 * <field.name> {
 *   <all fields of the type>
 * }
 */
export const ObjectField = (field: GQLType, params: QueryFromTypeParams) => {
  const { typeMap } = params
  const nodeType = fieldType(field, typeMap)
  if (!nodeType) {
    return ''
  }
  return `${field.name} { ${createQueryFromType({ ...params, typeName: nodeType.name })} }`
}

/**
 * A field handler for all field types.
 *
 * The field is rendered if params.settings evaluates to true.
 * It is rendered as an object field if the params.settings is not boolean.
 */
export const SimpleFieldHandler = (
  field: GQLType,
  params: QueryFromTypeParams,
): string => {
  const { settings } = params
  if (!settings) {
    // not enabled
    return ''
  }
  if (settings === true) {
    // render as a simple field
    return `${field.name}`
  }
  return ObjectField(field, params)
}


export const SimpleFieldHandlers = {
  __default: SimpleFieldHandler
} as FieldHandlers


export const createQueryFromType = (params: QueryFromTypeParams): string => {
  const { typeName, typeMap, handlers, settings } = params
  const typeFields: GQLType[] = get(typeMap, [typeName, 'fields'])
  if (!typeFields) {
    return ''
  }
  let defaultHandler: FieldHandler | undefined = get(handlers, '__default')
  return typeFields.reduce((current: string, field: GQLType) => {
    const setting = get(settings, field.name)
    if (setting) {
      let handler: FieldHandler | undefined = get(handlers, field.name, defaultHandler)
      if (handler) {
        const fieldQuery = handler(field, { ...params, settings: setting })
        if (fieldQuery && fieldQuery !== '') {
          return `${current} ${fieldQuery}`
        }
      }
    }
    return current
  }, '')
}
