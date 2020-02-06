# ra-data-postgraphile

[![Build Status](https://travis-ci.com/lovelysystems/ra-data-postgraphile.svg?branch=master)](https://travis-ci.com/lovelysystems/ra-data-postgraphile)

Postgraphile data provider for react-admin

This data provider heavily extends https://github.com/BowlingX/ra-postgraphile with a more generic approach.

## Install

    $ yarn add ra-data-postgraphile / npm install ra-data-postgraphile --save

## Usage

The `ra-data-postgraphile` data provider accepts these arguments:

- `client` - The `ApolloClient` instance to use.
- `cache` - optional apollo cache
   default:
    `return new InMemoryCache({dataIdFromObject: (object: any) => object.nodeId || null})`
- `config` - _optional_ configuration

    pgDataProvider({client, [cache], [config]})

The following examples shows the basic usage:

```js
import React, { useEffect, useState } from 'react'
import { Admin, Resource, Loading } from 'react-admin'
import pgDataProvider from 'ra-data-postgraphile'
import { CompanyList, CompanyEdit, CompanyCreate } from './posts'

const App = () => {
  const [dataProvider, setDataProvider] = useState(null)

  useEffect(() => {
    ;(async () => {
      const dataProvider = await pgDataProvider({
        uri: '/graphql',
        options: {
          resources: {
            Company: {
              pluralizedName: 'Companies',
            }
          }
        }
      })
      setDataProvider(dataProvider)
    })()
  }, [])

  if (!dataProvider) {
    return <Loading />
  }
  return (
    <Admin dataProvider={dataProvider}>
      <Resource
        name="Company"
        list={CompanyList}
        edit={CompanyEdit}
        create={CompanyCreate}
      />
    </Admin>
  )
}

export default App
```

## Features

### Filter Operations

It is possible to use different filter operations for the list filters.
The operation can be provided in the filter name:

name = `<propertyName> <operation>`

The possible operations depend on the field type of the propertyName.

Example:

Filter field `refId` is `null`: `refId null`

See [src/filters.ts] for the integrated filters:

### Compound Primary Keys

Because react admin expect that a record has a single id field
ra-data-postgraphile detects compound primary keys and switch to use `nodeId`
as the internal `id` for the record.

The internal representation of a record is different for compound keys. The
original `id` field is copied to `__rawId` and `nodeId` is copied into the `id`
field. This makes sure react admin receives a unique id value.

When your project contains compound primary keys it is also necessary to
change the apollo cache to not use the `id` field. Use this code to create an
apollo instance which uses the `nodeId` as primary key:

```
  const cache = new InMemoryCache({
    dataIdFromObject: object => object.nodeId || null
  })
  const client = new ApolloClient({
    uri: '/graphql',
    cache,
  })
```

## Limitations

ra-data-postgraphile expects these plugins to be installed on the postgraphile server:

```js
const PgSimplifyInflectorPlugin = require('@graphile-contrib/pg-simplify-inflector')
const PgConnectionFilterPlugin = require('postgraphile-plugin-connection-filter')
```

## TODO

 - implement DELETE_MANY

## License

ra-data-postgraphile is licensed under the [Apache 2.0](https://github.com/lovelysystems/ra-data-postgraphile/blob/master/LICENSE), sponsored and supported by [Lovely Systems](https://www.lovelysystems.com).
