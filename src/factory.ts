import { ApolloClient, InMemoryCache } from '@apollo/client'
import { HttpLink } from 'apollo-link-http'
import { onError } from 'apollo-link-error'
import { ApolloLink } from 'apollo-link'

import resource from './resource'
import buildGraphQLProvider, { IntrospectionResult } from 'ra-data-graphql'

export type FactorySettings = {
  uri?: string
  link?: any
  cache?: any
  options: any
}

const createBuildQuery =
  (options: any) => (introspectionResults: IntrospectionResult) =>
    resource(introspectionResults, { options })

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
            // eslint-disable-next-line no-console
            console.log(
              `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
            ),
          )
        // eslint-disable-next-line no-console
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
  const buildQuery = createBuildQuery(options)
  return buildGraphQLProvider({
    client,
    buildQuery,
  })
}
