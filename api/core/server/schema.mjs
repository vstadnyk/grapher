import gql from 'graphql-tag'

export default gql`
	type ServerInfo {
		name: String
		version: String
		description: String
		url: String
		hostname: String
		port: Int
		dateTime: DateTime
		timeZone: String
		ssl: JSON
		sslValidFrom: DateTime
		sslValidTo: DateTime
		apiEndPoint: String
		apiEndPointEncrypted: String
		subscriptionsEndPoint: String
		subscriptionsEndPointEncrypted: String
		dataBase: String
		schemaUrlJSON: String
		schemaUrlGraphql: String
		apiLoger: JSON
		pushServer: JSON
		JWT: JSON
		locales: JSON
		instance: JSON
	}

	extend type Query {
		serverInfo: ServerInfo
		serverLog(type: String = "errors", input: GetServerLog): JSON
		tokenInfo(token: String): JSON
	}

	extend type Mutation {
		_clearServerLog(type: String = "errors"): Boolean
		_editSSL(key: String!, cert: String!): Boolean
		_stopServer(pm: Boolean = true): Boolean
		_restartServer(pm: Boolean = true): Boolean
	}

	input GetServerLog {
		apptype: [String]
		appplatform: [String]
		errorType: [String]
		date: [String]
		params: Params
	}
`
