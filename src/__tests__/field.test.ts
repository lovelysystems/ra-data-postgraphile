import merge from 'lodash/merge'
import {
  createQueryFromType,
  SimpleFieldHandlers,
} from '../field'
import { ContentPatch, ContentType, ContentBlockType } from './helpers'

describe('createQueryFromType', () => {

  it('provides simple field types', () => {
    expect(
      createQueryFromType(
        {
          typeName: 'Content',
          typeMap: {
            Content: ContentType,
            ContentBlock: ContentBlockType,
          },
          handlers: SimpleFieldHandlers,
          settings: {
            nodeId: true,
            name: true,
            blocks: true,
            block: {
              type: true
            },
            '=de': {
              arguments: 'filter: {lang: {equalTo: DE}}',
              query: {
                blocks: {
                  type: true,
                }
              }
            },
            pubTs: true,
            deleted: true,
            id: true,
            ts: true,
            author: true,
          }
        }
      ),
    ).toStrictEqual(
      ' de: blocks(filter: {lang: {equalTo: DE}}) {  type } author block {  type } blocks deleted id name nodeId pubTs ts',
    )
  })

  it('allows to define alias w/o arguments', () => {
    expect(
      createQueryFromType(
        {
          typeName: 'Content',
          typeMap: {
            Content: ContentType,
            ContentBlock: ContentBlockType,
          },
          handlers: SimpleFieldHandlers,
          settings: {
            '=effective': {
              query: {
                pubTs: true,
            }
          }
        }
      ),
    ).toStrictEqual(
      ' effective: pubTs',
    )
  })

  it('can be configured for object fields', () => {
    const myFieldHandlers = merge(
      {},
      SimpleFieldHandlers,
      {
        nodeId: () => {
          return 'changedNameForNodeId'
        }
      }
    )
    expect(
      createQueryFromType(
        {
          typeName: 'Content',
          typeMap: {
            Content: ContentType,
          },
          handlers: myFieldHandlers,
          settings: {
            nodeId: true,
            name: true,
            id: true,
          },
        }
      ),
    ).toStrictEqual(
      ' id name changedNameForNodeId',
    )
  })
  })

})
