import buildGraphQLProvider from 'ra-data-graphql'

import ApolloClient from 'apollo-client'
import {InMemoryCache} from 'apollo-cache-inmemory'
import {HttpLink} from 'apollo-link-http'
import {onError} from 'apollo-link-error'
import {ApolloLink, Observable} from 'apollo-link'

import resource from './resource'
import {throwServerError} from 'apollo-link-http-common'

export type FactorySettings = {
  uri?: string
  link?: ApolloLink
  cache?: any
  options: any
}

const errorLink = onError(({graphQLErrors, networkError}) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({message, locations, path}) =>
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
      ),
    )
  if (networkError) {
    console.log(`[Network error]: ${networkError}`)
    if ('statusCode' in networkError) {
      if ('bodyText' in networkError) {
        return new Observable(obs => {
          const response = {status: networkError.statusCode, ok: false}
          throwServerError(response, 'ServerError', networkError.bodyText)
        })
      }
    }
  }
})


export const factory = ({uri, link, cache, options, ...rest}: FactorySettings) => {
  cache = cache || new InMemoryCache({
    dataIdFromObject: (object: any) => object.nodeId || null,
  })
  link = ApolloLink.from([errorLink, link || new HttpLink({uri: uri})])

  const client = new ApolloClient({
    cache: cache,
    link: link,
    ...rest,
  })
  return buildGraphQLProvider({
    client,
    buildQuery: resource,
    options,
  })
}
