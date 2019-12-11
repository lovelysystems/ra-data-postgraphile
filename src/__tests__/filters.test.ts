import { mapFilterType, createFilter } from '../filters'
import { GQLType } from '../types'

const IntType: GQLType = {
  name: 'Int',
}

const StringType: GQLType = {
  name: 'String',
}

const BooleanType: GQLType = {
  name: 'Boolean',
}

const ENUMType: GQLType = {
  kind: 'ENUM',
  name: 'ContractType',
}

const UnknownType: GQLType = {
  kind: 'Kind',
  name: 'Unknown',
}

describe('filters', () => {
  describe('mapFilterType', () => {
    describe('type Int', () => {
      it('with value as int', () => {
        expect(mapFilterType(IntType, 2, [])).toStrictEqual({ equalTo: 2 })
      })

      it('value as string', () => {
        expect(mapFilterType(IntType, '42', [])).toStrictEqual({ equalTo: 42 })
      })

      it('value as array with ints', () => {
        expect(mapFilterType(IntType, [2, 3], [])).toStrictEqual({ in: [2, 3] })
      })

      it('value as array with ints and string', () => {
        expect(mapFilterType(IntType, [2, 3, '42'], [])).toStrictEqual({
          in: [2, 3, 42],
        })
      })
    })

    describe('type String operation', () => {
      it('default', () => {
        expect(mapFilterType(StringType, 'str', [])).toStrictEqual({ likeInsensitive: '%str%' })
      })
      it('=', () => {
        expect(mapFilterType(StringType, 'str', ['='])).toStrictEqual({ equalTo: 'str' })
      })
      it('!=', () => {
        expect(mapFilterType(StringType, 'str', ['!='])).toStrictEqual({ notEqualTo: 'str' })
      })
      it('likeInsensitive', () => {
        expect(mapFilterType(StringType, 'str', ['likeInsensitive'])).toStrictEqual({ likeInsensitive: '%str%' })
      })
      it('null', () => {
        expect(mapFilterType(StringType, 'str', ['null'])).toStrictEqual({ isNull: true })
      })
      it('!null', () => {
        expect(mapFilterType(StringType, 'str', ['!null'])).toStrictEqual({ isNull: false })
      })
    })

    describe('type Boolean operation', () => {
      it('default', () => {
        expect(mapFilterType(BooleanType, false, [])).toStrictEqual({ equalTo: false })
      })
      it('=', () => {
        expect(mapFilterType(BooleanType, true, ['='])).toStrictEqual({ equalTo: true })
      })
      it('!=', () => {
        expect(mapFilterType(BooleanType, true, ['!='])).toStrictEqual({ notEqualTo: true })
      })
    })

    describe('type Int operation', () => {
      it('default', () => {
        expect(mapFilterType(IntType, 2, [])).toStrictEqual({ equalTo: 2 })
      })
      it('=', () => {
        expect(mapFilterType(IntType, 2, ['='])).toStrictEqual({ equalTo: 2 })
      })
      it('!=', () => {
        expect(mapFilterType(IntType, 2, ['!='])).toStrictEqual({ notEqualTo: 2 })
      })
      it('<', () => {
        expect(mapFilterType(IntType, 2, ['<'])).toStrictEqual({ lessThan: 2 })
      })
      it('<=', () => {
        expect(mapFilterType(IntType, 2, ['<='])).toStrictEqual({ lessThanOrEqualTo: 2 })
      })
      it('>', () => {
        expect(mapFilterType(IntType, 2, ['>'])).toStrictEqual({ greaterThan: 2 })
      })
      it('>=', () => {
        expect(mapFilterType(IntType, 2, ['>='])).toStrictEqual({ greaterThanOrEqualTo: 2 })
      })
      it('null', () => {
        expect(mapFilterType(IntType, true, ['null'])).toStrictEqual({ isNull: true })
      })
      it('!null', () => {
        expect(mapFilterType(IntType, true, ['!null'])).toStrictEqual({ isNull: false })
      })
    })

    describe('type IntArray operation', () => {
      it('default', () => {
        expect(mapFilterType(IntType, [2, 3], [])).toStrictEqual({ in: [2, 3] })
      })
      it('in', () => {
        expect(mapFilterType(IntType, [2, 3], ['in'])).toStrictEqual({ in: [2, 3] })
      })
      it('!in', () => {
        expect(mapFilterType(IntType, [2, 3], ['!in'])).toStrictEqual({ notIn: [2, 3] })
      })
      it('=', () => {
        expect(mapFilterType(IntType, [2, 3], ['='])).toStrictEqual({ in: [2, 3] })
      })
      it('!=', () => {
        expect(mapFilterType(IntType, [2, 3], ['!='])).toStrictEqual({ notIn: [2, 3] })
      })
    })

    describe('type ENUM operation', () => {
      it('default', () => {
        expect(mapFilterType(ENUMType, 'V', [])).toStrictEqual({ equalTo: 'V' })
      })
      it('=', () => {
        expect(mapFilterType(ENUMType, 'V', ['='])).toStrictEqual({ equalTo: 'V' })
      })
      it('!=', () => {
        expect(mapFilterType(ENUMType, 'V', ['!='])).toStrictEqual({ notEqualTo: 'V' })
      })
      it('null', () => {
        expect(mapFilterType(ENUMType, true, ['null'])).toStrictEqual({ isNull: true })
      })
      it('!null', () => {
        expect(mapFilterType(ENUMType, true, ['!null'])).toStrictEqual({ isNull: false })
      })
    })

    describe('type ENUMArray operation', () => {
      it('default', () => {
        expect(mapFilterType(ENUMType, ['V', 'V2'], [])).toStrictEqual({ in: ['V', 'V2'] })
      })
      it('=', () => {
        expect(mapFilterType(ENUMType, ['V', 'V2'], ['='])).toStrictEqual({ in: ['V', 'V2'] })
      })
      it('!=', () => {
        expect(mapFilterType(ENUMType, ['V', 'V2'], ['!='])).toStrictEqual({ notIn: ['V', 'V2'] })
      })
      it('in', () => {
        expect(mapFilterType(ENUMType, ['V', 'V2'], ['in'])).toStrictEqual({ in: ['V', 'V2'] })
      })
      it('!in', () => {
        expect(mapFilterType(ENUMType, ['V', 'V2'], ['!in'])).toStrictEqual({ notIn: ['V', 'V2'] })
      })
    })

    describe('unknown types', () => {
      it('throws an error', () => {
        expect(() => mapFilterType(UnknownType, 'value', [])).toThrow(
          'Filter for type "Unknown" or kind "Kind" not implemented.',
        )
      })
    })
  })

  describe('createFilter', () => {
    const FilterType: GQLType = {
      fields: [
        { name: 'i', type: { name: 'Int' } },
        { name: 'ia', type: { name: 'Int' } },
        { name: 's', type: { name: 'String' } },
        { name: 's2', type: { ofType: { name: 'String' } } },
      ],
    }

    it('returnd undefined on empty filter input', () => {
      expect(createFilter({}, FilterType)).toBeUndefined()
    })

    it('ignores unknwon property names', () => {
      expect(createFilter({ unknown: 'value' }, FilterType)).toBeUndefined()
    })

    it('creates a postgraphile filter expression', () => {
      expect(
        createFilter(
          {
            'i !=': 1,
            ia: [1, 2],
            's null': null,
            s2: 's2',
          },
          FilterType,
        ),
      ).toStrictEqual({
        and: [
          {
            i: { notEqualTo: 1 },
            ia: { in: [1, 2] },
            s: { isNull: true },
            s2: { likeInsensitive: '%s2%' },
          },
        ],
      })
    })
  })
})
