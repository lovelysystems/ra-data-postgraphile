# ra-data-postgraphile

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
          typePluralizer: {
            Company: 'Companies',
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

Can handle any type for the `id` field.

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

## Configuration

You can pass an _optional_ configuration object:

```js
const pgDataProviderConfig = {
  queryValueToInputValueMap: {
    GeographyPoint: value => value.geojson
  },
  pluralizerMap: {
    Company: 'Companies',
  },
}
```

### queryValueToInputValueMap

Allows you to specify a mapping of how a type should map if it's taken as an Input.

The Map is also used to specify what complex types should be completely queried.
By default only `scalar` and `scalar[]` fields are fetched.

### pluralizerMap

Allows to map resources names to its pluralized form if needed.

By default the pluralized form of the resource is created by simply adding `s`
to the resource name. Because of the way postgraphile is using the pluralized
form it is necessary to manually provide the correct pluralized form. 

## TODO

 - implement DELETE
 - implement DELETE_MANY

## License

ra-data-postgraphile is licensed under the [Apache 2.0](https://github.com/lovelysystems/ra-data-postgraphile/blob/master/LICENSE.md), sponsored and supported by [Lovely Systems](https://www.lovelysystems.com).
