import {
  capitalize,
  lowercase,
  snake,
  createSortingKey,
  fieldIsObjectOrListOfObject,
  createTypeMap,
} from '../utils'

describe('utils', () => {
  describe('string transformations', () => {
    it('capitalizes strings', () => {
      expect(capitalize('lower')).toBe('Lower')
    })

    it('lowercases strings', () => {
      expect(lowercase('UPPer')).toBe('uPPer')
    })

    it('builds snake version of camel case strings', () => {
      expect(snake('CamelCaseMore')).toBe('Camel_Case_More')
    })
  })

  describe('creates sorting keys', () => {
    it('field name and order', () => {
      expect(createSortingKey('camelCaseFieldName', 'DESC')).toBe(
        'CAMEL_CASE_FIELD_NAME_DESC',
      )
    })
  })

  describe('check if GQL type is object or list of objects', () => {
    it('is true for object type', () => {
      expect(
        fieldIsObjectOrListOfObject({
          type: {
            kind: 'OBJECT',
          },
        }),
      ).toBe(true)
    })

    it('is true if ofType is object type', () => {
      expect(
        fieldIsObjectOrListOfObject({
          type: {
            type: 'NONE_NULL',
            ofType: {
              kind: 'OBJECT',
            },
          },
        }),
      ).toBe(true)
    })

    it('is true for list of object type', () => {
      expect(
        fieldIsObjectOrListOfObject({
          type: {
            type: 'NONE_NULL',
            ofType: {
              kind: 'LIST',
            },
          },
        }),
      ).toBe(true)
    })

    it('is false for none object types', () => {
      expect(
        Boolean(
          fieldIsObjectOrListOfObject({
            type: {
              type: 'Int',
            },
          }),
        ),
      ).toBe(false)
    })
  })

  describe('createTypeMap', () => {
    it('creates a mapping from type lists', () => {
      expect(createTypeMap([{ name: 'v1' }, { name: 'v2' }])).toStrictEqual({
        v1: {
          name: 'v1',
        },
        v2: {
          name: 'v2',
        },
      })
    })
  })
})
