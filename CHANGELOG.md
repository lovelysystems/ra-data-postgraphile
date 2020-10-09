# Changelog

## Unreleased

### Development

- Use Typescript 4.0.3
- Adapted a lot of dependecies to align with lovely-ra

## 2020-10-09 / 0.8.0

### Feature

- Added support for `Datetime` field type.
- Omit `__typename` property on object fields in input/update mutations
- Support the use of arguments on simple fields.
- Possibility to use an alternative backendResourceName in resource options

### Fixes

- fixed the `deleteOne` fetch operation for resources with compound keys.
- fixed an issue in fetch operation in case data is null.

## 2020-02-17 / 0.7.1

### Fixes

- do not modify GraphQL schema when computing filters

## 2020-02-17 / 0.7.0

### Feature

- Support `IntListFilters` for field type `[Int]`

## 2020-02-06 / 0.6.2

### Fixes

- fixed commonjs build

## v0.6.1

- fix brown bag release

## v0.6.0

- fix update for compound key resources

- allow field [alias](https://graphql.org/learn/queries/#aliases) and [arguments](https://graphql.org/learn/queries/#arguments)
  in query settings

## v0.5.4

- allow to build more complex update mutations
  It is now possible to combine multiple mutations into one.

## v0.5.3

- BaseResource methods as class methods not properties

## v0.5.2

- switched from apollo-boost to apollo-client to allow link configuration

## v0.5.1

- allow to overwrite typeToFilterMap via options
- use property with primary key name ad internal id field

## v0.5.0

- resources must be configured via the factory options
- refactoring of the resource implementation to be able to adapt the existing
  resource handler

## v0.4.0

- list filters can now contain operations

## v0.3.0

- fix delete parameter

## v0.2.0

- added DELETE
- Only provide methods if the backend provides them for:
  create, update, updateMany, delete

## v0.1.2

- updated to react-admin 3.0.0

## v0.1.1

- fix GET_MANY

## v0.1.0 initial release
