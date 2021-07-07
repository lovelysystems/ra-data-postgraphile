import { mapFilterType, createFilter } from '../filters'
import { GQLType } from '../types'

const IntType: GQLType = {
  name: 'Int',
}

const IntListType: GQLType = {
  name: 'IntList',
}

const StringType: GQLType = {
  name: 'String',
}

const StringListType: GQLType = {
  name: 'StringList',
}

const BooleanType: GQLType = {
  name: 'Boolean',
}

const DatetimeType: GQLType = {
  name: 'Datetime',
}

const ENUMType: GQLType = {
  kind: 'ENUM',
  name: 'ContractType',
}

const FullTextType: GQLType = {
  kind: 'SCALAR',
  name: 'FullText',
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
        expect(mapFilterType(StringType, 'str', [])).toStrictEqual({
          likeInsensitive: '%str%',
        })
      })
      it('=', () => {
        expect(mapFilterType(StringType, 'str', ['='])).toStrictEqual({
          equalTo: 'str',
        })
      })
      it('!=', () => {
        expect(mapFilterType(StringType, 'str', ['!='])).toStrictEqual({
          notEqualTo: 'str',
        })
      })
      it('likeInsensitive', () => {
        expect(
          mapFilterType(StringType, 'str', ['likeInsensitive']),
        ).toStrictEqual({ likeInsensitive: '%str%' })
      })
      it('null', () => {
        expect(mapFilterType(StringType, 'str', ['null'])).toStrictEqual({
          isNull: true,
        })
      })
      it('!null', () => {
        expect(mapFilterType(StringType, 'str', ['!null'])).toStrictEqual({
          isNull: false,
        })
      })
    })

    describe('type StringList operation', () => {
      it('default', () => {
        expect(mapFilterType(StringListType, 'car', [])).toStrictEqual({
          equalTo: ['car'],
        })
      })
      it('=', () => {
        expect(mapFilterType(StringListType, 'car,house', ['='])).toStrictEqual(
          {
            equalTo: ['car', 'house'],
          },
        )
      })
      it('contains', () => {
        expect(
          mapFilterType(StringListType, 'car , house ,', ['contains']),
        ).toStrictEqual({
          contains: ['car', 'house'],
        })
      })
      it('containedBy', () => {
        expect(
          mapFilterType(StringListType, 'big car,house, ', ['containedBy']),
        ).toStrictEqual({
          containedBy: ['big car', 'house'],
        })
      })
    })

    describe('type Boolean operation', () => {
      it('default', () => {
        expect(mapFilterType(BooleanType, false, [])).toStrictEqual({
          equalTo: false,
        })
      })
      it('=', () => {
        expect(mapFilterType(BooleanType, true, ['='])).toStrictEqual({
          equalTo: true,
        })
      })
      it('!=', () => {
        expect(mapFilterType(BooleanType, true, ['!='])).toStrictEqual({
          notEqualTo: true,
        })
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
        expect(mapFilterType(IntType, 2, ['!='])).toStrictEqual({
          notEqualTo: 2,
        })
      })
      it('<', () => {
        expect(mapFilterType(IntType, 2, ['<'])).toStrictEqual({ lessThan: 2 })
      })
      it('<=', () => {
        expect(mapFilterType(IntType, 2, ['<='])).toStrictEqual({
          lessThanOrEqualTo: 2,
        })
      })
      it('>', () => {
        expect(mapFilterType(IntType, 2, ['>'])).toStrictEqual({
          greaterThan: 2,
        })
      })
      it('>=', () => {
        expect(mapFilterType(IntType, 2, ['>='])).toStrictEqual({
          greaterThanOrEqualTo: 2,
        })
      })
      it('null', () => {
        expect(mapFilterType(IntType, true, ['null'])).toStrictEqual({
          isNull: true,
        })
      })
      it('!null', () => {
        expect(mapFilterType(IntType, true, ['!null'])).toStrictEqual({
          isNull: false,
        })
      })
    })

    describe('type IntArray operation', () => {
      it('default', () => {
        expect(mapFilterType(IntType, [2, 3], [])).toStrictEqual({ in: [2, 3] })
      })
      it('in', () => {
        expect(mapFilterType(IntType, [2, 3], ['in'])).toStrictEqual({
          in: [2, 3],
        })
      })
      it('!in', () => {
        expect(mapFilterType(IntType, [2, 3], ['!in'])).toStrictEqual({
          notIn: [2, 3],
        })
      })
      it('=', () => {
        expect(mapFilterType(IntType, [2, 3], ['='])).toStrictEqual({
          in: [2, 3],
        })
      })
      it('!=', () => {
        expect(mapFilterType(IntType, [2, 3], ['!='])).toStrictEqual({
          notIn: [2, 3],
        })
      })
    })

    describe('type IntList operation', () => {
      it('default', () => {
        expect(mapFilterType(IntListType, 2, [])).toStrictEqual({
          anyEqualTo: 2,
        })
      })
      it('=', () => {
        expect(mapFilterType(IntListType, '2', ['='])).toStrictEqual({
          anyEqualTo: 2,
        })
      })
      it('!=', () => {
        expect(mapFilterType(IntListType, 2, ['!='])).toStrictEqual({
          anyNotEqualTo: 2,
        })
      })
      it('anyEqualTo', () => {
        expect(mapFilterType(IntListType, '2', ['anyEqualTo'])).toStrictEqual({
          anyEqualTo: 2,
        })
      })
      it('anyNotEqualTo', () => {
        expect(mapFilterType(IntListType, 2, ['anyNotEqualTo'])).toStrictEqual({
          anyNotEqualTo: 2,
        })
      })
    })

    describe('type IntListArray operation', () => {
      it('default', () => {
        expect(mapFilterType(IntListType, [2, 3], [])).toStrictEqual({
          overlaps: [2, 3],
        })
      })
      it('=', () => {
        expect(mapFilterType(IntListType, [2, 3], ['='])).toStrictEqual({
          equalTo: [2, 3],
        })
      })
      it('!=', () => {
        expect(mapFilterType(IntListType, [2, 3], ['!='])).toStrictEqual({
          notEqualTo: [2, 3],
        })
      })
      it('overlaps', () => {
        expect(mapFilterType(IntListType, [2, 3], ['overlaps'])).toStrictEqual({
          overlaps: [2, 3],
        })
      })
      it('contains', () => {
        expect(mapFilterType(IntListType, [2, 3], ['contains'])).toStrictEqual({
          contains: [2, 3],
        })
      })
      it('containedBy', () => {
        expect(
          mapFilterType(IntListType, [2, 3], ['containedBy']),
        ).toStrictEqual({ containedBy: [2, 3] })
      })
      it('distinctFrom', () => {
        expect(
          mapFilterType(IntListType, [2, 3], ['distinctFrom']),
        ).toStrictEqual({ distinctFrom: [2, 3] })
      })
      it('notDistinctFrom', () => {
        expect(
          mapFilterType(IntListType, [2, 3], ['notDistinctFrom']),
        ).toStrictEqual({ notDistinctFrom: [2, 3] })
      })
    })

    describe('type FullText operation', () => {
      it('simple tokens get an asterisk appended', () => {
        expect(mapFilterType(FullTextType, 'wor', [])).toStrictEqual({
          matches: 'wor*',
        })
      })
      it('on multiple simple tokens an asterisk is appended to each token', () => {
        expect(mapFilterType(FullTextType, 'let fin wor', [])).toStrictEqual({
          matches: 'let* fin* wor*',
        })
      })
      it('or queries use whole word without asterisk', () => {
        expect(mapFilterType(FullTextType, 'boy or girl', [])).toStrictEqual({
          matches: 'boy or girl',
        })
        expect(mapFilterType(FullTextType, 'boy,girl', [])).toStrictEqual({
          matches: 'boy,girl',
        })
        expect(mapFilterType(FullTextType, 'boy | girl', [])).toStrictEqual({
          matches: 'boy | girl',
        })
      })
      it('negated queries do not use asterisk', () => {
        expect(mapFilterType(FullTextType, '!house', [])).toStrictEqual({
          matches: '!house',
        })
        expect(mapFilterType(FullTextType, '-house', [])).toStrictEqual({
          matches: '-house',
        })
      })
      it('quoted queries do not use asterisk', () => {
        expect(mapFilterType(FullTextType, '"my mind"', [])).toStrictEqual({
          matches: '"my mind"',
        })
        expect(mapFilterType(FullTextType, "'my mind'", [])).toStrictEqual({
          matches: "'my mind'",
        })
      })
      it('explicit and queries do not use asterisk', () => {
        expect(mapFilterType(FullTextType, 'cat & mouse', [])).toStrictEqual({
          matches: 'cat & mouse',
        })
        expect(mapFilterType(FullTextType, 'cat and mouse', [])).toStrictEqual({
          matches: 'cat and mouse',
        })
      })
      it('mixed queries do not use asterisk', () => {
        expect(mapFilterType(FullTextType, 'cat dog !mouse', [])).toStrictEqual(
          {
            matches: 'cat dog !mouse',
          },
        )
        expect(mapFilterType(FullTextType, 'cat dog, mouse', [])).toStrictEqual(
          {
            matches: 'cat dog, mouse',
          },
        )
        expect(
          mapFilterType(FullTextType, 'cat dog "giant ant"', []),
        ).toStrictEqual({
          matches: 'cat dog "giant ant"',
        })
      })
      it('on quoted single words no asterisks is appended', () => {
        expect(mapFilterType(FullTextType, 'cat "dog"', [])).toStrictEqual({
          matches: 'cat* "dog"',
        })
        expect(mapFilterType(FullTextType, "cat 'dog'", [])).toStrictEqual({
          matches: 'cat* "dog"',
        })
      })
      it('unfinished single quotes are removed to avoid tsquery errors', () => {
        expect(mapFilterType(FullTextType, "'typin", [])).toStrictEqual({
          matches: 'typin*',
        })
      })
      it('using the equals method will not append asterisks at all', () => {
        expect(mapFilterType(FullTextType, 'wor', ['='])).toStrictEqual({
          matches: 'wor',
        })
      })
    })

    describe('type ENUM operation', () => {
      it('default', () => {
        expect(mapFilterType(ENUMType, 'V', [])).toStrictEqual({ equalTo: 'V' })
      })
      it('=', () => {
        expect(mapFilterType(ENUMType, 'V', ['='])).toStrictEqual({
          equalTo: 'V',
        })
      })
      it('!=', () => {
        expect(mapFilterType(ENUMType, 'V', ['!='])).toStrictEqual({
          notEqualTo: 'V',
        })
      })
      it('null', () => {
        expect(mapFilterType(ENUMType, true, ['null'])).toStrictEqual({
          isNull: true,
        })
      })
      it('!null', () => {
        expect(mapFilterType(ENUMType, true, ['!null'])).toStrictEqual({
          isNull: false,
        })
      })
    })

    describe('type ENUMArray operation', () => {
      it('default', () => {
        expect(mapFilterType(ENUMType, ['V', 'V2'], [])).toStrictEqual({
          in: ['V', 'V2'],
        })
      })
      it('=', () => {
        expect(mapFilterType(ENUMType, ['V', 'V2'], ['='])).toStrictEqual({
          in: ['V', 'V2'],
        })
      })
      it('!=', () => {
        expect(mapFilterType(ENUMType, ['V', 'V2'], ['!='])).toStrictEqual({
          notIn: ['V', 'V2'],
        })
      })
      it('in', () => {
        expect(mapFilterType(ENUMType, ['V', 'V2'], ['in'])).toStrictEqual({
          in: ['V', 'V2'],
        })
      })
      it('!in', () => {
        expect(mapFilterType(ENUMType, ['V', 'V2'], ['!in'])).toStrictEqual({
          notIn: ['V', 'V2'],
        })
      })
    })

    describe('type Datetime operation', () => {
      it('default', () => {
        expect(
          mapFilterType(
            DatetimeType,
            new Date('05 October 2020 14:48 UTC'),
            [],
          ),
        ).toStrictEqual({ equalTo: '2020-10-05T14:48:00.000Z' })
      })
      it('!=', () => {
        expect(
          mapFilterType(DatetimeType, new Date('05 October 2020 14:48 UTC'), [
            '!=',
          ]),
        ).toStrictEqual({ notEqualTo: '2020-10-05T14:48:00.000Z' })
      })
      it('<', () => {
        expect(
          mapFilterType(DatetimeType, new Date('05 October 2020 14:48 UTC'), [
            '<',
          ]),
        ).toStrictEqual({ lessThan: '2020-10-05T14:48:00.000Z' })
      })
      it('<=', () => {
        expect(
          mapFilterType(DatetimeType, new Date('05 October 2020 14:48 UTC'), [
            '<=',
          ]),
        ).toStrictEqual({ lessThanOrEqualTo: '2020-10-05T14:48:00.000Z' })
      })
      it('>', () => {
        expect(
          mapFilterType(DatetimeType, new Date('05 October 2020 14:48 UTC'), [
            '>',
          ]),
        ).toStrictEqual({ greaterThan: '2020-10-05T14:48:00.000Z' })
      })
      it('>=', () => {
        expect(
          mapFilterType(DatetimeType, new Date('05 October 2020 14:48 UTC'), [
            '>=',
          ]),
        ).toStrictEqual({ greaterThanOrEqualTo: '2020-10-05T14:48:00.000Z' })
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
        {
          name: 'intList',
          type: { kind: 'LIST', ofType: { kind: 'SCALAR', name: 'Int' } },
        },
        {
          name: 'intList2',
          type: { kind: 'LIST', ofType: { kind: 'SCALAR', name: 'Int' } },
        },
        { name: 's', type: { name: 'String' } },
        { name: 's2', type: { ofType: { name: 'String' } } },
        { name: 'ft1', type: { name: 'FullText' } },
        { name: 'ft2', type: { name: 'FullText' } },
      ],
    }

    it('returnd undefined on empty filter input', () => {
      expect(createFilter({}, FilterType)).toStrictEqual({
        filterOrderBy: [],
        filters: undefined,
      })
    })

    it('ignores unknwon property names', () => {
      expect(createFilter({ unknown: 'value' }, FilterType)).toStrictEqual({
        filterOrderBy: [],
        filters: undefined,
      })
    })

    it('creates a postgraphile filter expression', () => {
      expect(
        createFilter(
          {
            'i !=': 1,
            ia: [1, 2],
            intList: 3,
            intList2: [3, 4],
            's null': null,
            s2: 's2',
          },
          FilterType,
          null,
        ),
      ).toStrictEqual({
        filterOrderBy: [],
        filters: {
          and: [
            {
              i: { notEqualTo: 1 },
              ia: { in: [1, 2] },
              intList: { anyEqualTo: 3 },
              intList2: { overlaps: [3, 4] },
              s: { isNull: true },
              s2: { likeInsensitive: '%s2%' },
            },
          ],
        },
      })
    })

    it('creates ordered by list for configured fields', () => {
      expect(
        createFilter(
          {
            ft1: 'work',
            ft2: 'life',
          },
          FilterType,
          null,
        ),
      ).toStrictEqual({
        filterOrderBy: ['FT1_RANK_DESC', 'FT2_RANK_DESC'],
        filters: {
          and: [
            {
              ft1: { matches: 'work*' },
              ft2: { matches: 'life*' },
            },
          ],
        },
      })
    })

    it('order of filters defines ordered by position', () => {
      expect(
        createFilter(
          {
            ft2: 'two',
            ft1: 'one',
          },
          FilterType,
          null,
        ).filterOrderBy,
      ).toStrictEqual(['FT2_RANK_DESC', 'FT1_RANK_DESC'])
    })

    it('combination of include and exclude filters for the same property is possible', () => {
      expect(
        createFilter(
          {
            i: 1, // e.g filter from input field
            'i !in': [2, 3], // e.g. hardcoded filter
          },
          FilterType,
          null,
        ),
      ).toStrictEqual({
        filterOrderBy: [],
        filters: {
          and: [
            {
              i: {
                equalTo: 1,
                notIn: [2, 3],
              },
            },
          ],
        },
      })
    })

    it('type map can be provided', () => {
      const MyTypeToFilterMap = {
        Int: {
          special: ['isTheAnswer', () => 42],
        },
      }
      expect(
        createFilter({ 'i special': 1 }, FilterType, MyTypeToFilterMap),
      ).toStrictEqual({
        filterOrderBy: [],
        filters: {
          and: [
            {
              i: { isTheAnswer: 42 },
            },
          ],
        },
      })
    })
  })
})
