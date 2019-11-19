import { mapFilterType, createFilter } from '../filters'
import { GQLType } from '../types'

const IntType: GQLType = {
  name: 'Int',
}

const StringType: GQLType = {
  name: 'String',
}

const UnknownType: GQLType = {
  name: 'Unknown',
}

describe('filters', () => {
  describe('mapFilterType', () => {
    describe('type Int', () => {
      it('with value as int', () => {
        expect(mapFilterType(IntType, 2)).toStrictEqual({ equalTo: 2 })
      })

      it('value as string', () => {
        expect(mapFilterType(IntType, '42')).toStrictEqual({ equalTo: 42 })
      })

      it('value as array with ints', () => {
        expect(mapFilterType(IntType, [2, 3])).toStrictEqual({ in: [2, 3] })
      })

      it('value as array with ints and string', () => {
        expect(mapFilterType(IntType, [2, 3, '42'])).toStrictEqual({
          in: [2, 3, 42],
        })
      })
    })

    describe('type String', () => {
      it('as likeInsensitive', () => {
        expect(mapFilterType(StringType, 'value')).toStrictEqual({
          likeInsensitive: '%value%',
        })
      })
    })

    describe('unknown types', () => {
      it('throws an error', () => {
        expect(() => mapFilterType(UnknownType, 'value')).toThrow(
          'Filter for type Unknown not implemented.',
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
            i: 1,
            ia: [1, 2],
            s: 's',
            s2: 's2',
          },
          FilterType,
        ),
      ).toStrictEqual({
        and: [
          {
            i: { equalTo: 1 },
            ia: { in: [1, 2] },
            s: { likeInsensitive: '%s%' },
            s2: { likeInsensitive: '%s2%' },
          },
        ],
      })
    })
  })
})
