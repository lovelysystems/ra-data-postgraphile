import {
  capitalize,
  lowercase,
  snake,
  createSortingKey,
  fieldIsObjectOrListOfObject,
  createTypeMap,
  mapInputToVariables,
  createQueryFromType,
} from '../utils'
import { ContentPatch, ContentType, ContentBlockType } from './helpers'

describe('utils', () => {
  describe('string transformations', () => {
    it('capitalizes strings', () => {
      expect(capitalize('lower')).toStrictEqual('Lower')
    })

    it('lowercases strings', () => {
      expect(lowercase('UPPer')).toStrictEqual('uPPer')
    })

    it('builds snake version of camel case strings', () => {
      expect(snake('CamelCaseMore')).toStrictEqual('Camel_Case_More')
    })
  })

  describe('creates sorting keys', () => {
    it('field name and order', () => {
      expect(createSortingKey('camelCaseFieldName', 'DESC')).toStrictEqual(
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

  describe('mapInputToVariables', () => {
    it('maps simple types', () => {
      expect(
        mapInputToVariables(
          {
            name: 'the name',
            deleted: false,
          },
          ContentPatch,
          ContentType,
          {},
        ),
      ).toStrictEqual({
        deleted: false,
        name: 'the name',
      })
    })

    it('maps object types', () => {
      expect(
        mapInputToVariables(
          {
            name: 'the blocks',
            blocks: [],
          },
          ContentPatch,
          ContentType,
          {},
        ),
      ).toStrictEqual({
        blocks: [],
        name: 'the blocks',
      })
      expect(
        mapInputToVariables(
          {
            name: 'the blocks',
            blocks: [{ type: 'text', value: 'text' }],
          },
          ContentPatch,
          ContentType,
          {},
        ),
      ).toStrictEqual({
        blocks: [{ type: 'text', value: 'text' }],
        name: 'the blocks',
      })
    })

    it('allows to map properties based on its type', () => {
      expect(
        mapInputToVariables(
          {
            blocks: [{ type: 'text' }, { type: 'remove' }],
          },
          ContentPatch,
          ContentType,
          {
            ContentBlock: value => {
              return value.type === 'remove' ? null : value
            },
          },
        ),
      ).toStrictEqual({
        blocks: [{ type: 'text' }, null],
      })
    })

    it('ignores unknown input fields', () => {
      expect(
        mapInputToVariables(
          {
            unknwon: 'the unknown',
          },
          ContentPatch,
          ContentType,
          {},
        ),
      ).toStrictEqual({})
    })

    it('can handle empty input', () => {
      expect(mapInputToVariables({}, ContentPatch, {}, {})).toStrictEqual({})
    })
  })

  describe('createQueryFromType', () => {
    it('provides a property list', () => {
      expect(
        createQueryFromType(
          'Content',
          {
            Content: ContentType,
            ContentBlock: ContentBlockType,
          },
          ['ContentBlock'],
        ),
      ).toStrictEqual(
        ' nodeId name blocks block { type } pubTs deleted id ts author',
      )
    })
  })
})
