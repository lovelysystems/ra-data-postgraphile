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
          handlers: SimpleFieldHandlers
          settings: {
            nodeId: true,
            name: true,
            blocks: true,
            block: {
              type: true
            }
            pubTs: true,
            deleted: true,
            id: true,
            ts: true,
            author: true,
          }
        }
      ),
    ).toStrictEqual(
      ' nodeId name blocks block {  type } pubTs deleted id ts author',
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
          handlers: myFieldHandlers
          settings: {
            nodeId: true,
            name: true,
            id: true,
          }
        }
      ),
    ).toStrictEqual(
      ' changedNameForNodeId name id',
    )
  })
  })

})
