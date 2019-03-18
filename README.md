## Grapher server

Another GraphQL API server

### Main features

- Query, Mutation, Subscriptions, Custom scalar types
- Multilingual content
- Files upload
- User Permissions

### For developers

- No babel (work with flag "--experimental-modules" or ESM)
- Automatically generated schema.json
- Multilingual support for Error messages
- Logging errors and GraphQL queries
- One file resolver.js to keep resolvers for Queries, Mutations and Subscriptions
- One file schema.js for GraphQL schema, GraphQL custom scalar types and Sequelize schema
- Eslint with airbnb-base config and babel-eslint parser

### Included

- Koa2 server
- GraphQL server
- HTTP/HTTPS
- WebSockets for GraphQL subscriptions
- Postgres and Sequelize ORM as main database
- RethinkDB and Thinky ORM as auth database
- JWT and Passport.js for authorization
- Vue and Vue server render
- graphql-fields - show which fields sent API client with request
