# Changelog

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
