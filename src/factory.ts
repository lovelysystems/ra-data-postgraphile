import buildGraphQLProvider from 'ra-data-graphql'

import ApolloClient from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { HttpLink } from 'apollo-link-http'
import { onError } from 'apollo-link-error'
import { ApolloLink } from 'apollo-link'

import resource from './resource'

export type FactorySettings = {
  uri?: string
  link?: any
  cache?: any
  options: any
}

export const factory = ({
  uri,
  link,
  cache,
  options,
  ...rest
}: FactorySettings) => {
  const defaultCache = () => {
    return new InMemoryCache({
      dataIdFromObject: (object: any) => object.nodeId || null,
    })
  }
  const defaultLink = () => {
    return ApolloLink.from([
      onError(({ graphQLErrors, networkError }) => {
        if (graphQLErrors)
          graphQLErrors.forEach(({ message, locations, path }) =>
            console.log(
              `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
            ),
          )
        if (networkError) console.log(`[Network error]: ${networkError}`)
      }),
      new HttpLink({ uri }),
    ])
  }
  const client = new ApolloClient({
    cache: cache || defaultCache(),
    link: link || defaultLink(),
    ...rest,
  })
  return buildGraphQLProvider({
    client,
    buildQuery: resource,
    options,
  })
}
