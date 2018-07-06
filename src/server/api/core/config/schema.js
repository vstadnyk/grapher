import gql from 'graphql-tag'
import Sequelize from 'sequelize'

export const schema = gql`
	type Config {
		id: ID
		name: String
		description: String
		"""
		Replace with '_' any Latin/Number UTF-8 symbol
		"""
		key: String
		value: JSON
		active: Boolean
	}

	type Configs {
		count: Int
		rows: [Config]
	}

	extend type Query {
		config(input: GetConfigInput): Config
		configs(input: GetConfigInput): Configs
	}

	extend type Mutation {
		_modifyConfig(input: ConfigInput, keySeparator: String = "_"): Boolean
		_removeConfig(id: [ID!]!): Boolean
	}

	input ConfigInput {
		name: String
		description: String
		key: String!
		value: JSON
		active: Boolean
	}

	input GetConfigInput {
		id: [ID]
		key: [String]
		active: Boolean
		params: Params
	}
`

export const fields = {
	name: {
		type: Sequelize.TEXT,
	},
	description: {
		type: Sequelize.TEXT,
	},
	key: {
		type: Sequelize.TEXT,
		allowNull: false,
		unique: true,
	},
	value: {
		type: Sequelize.JSON,
	},
	active: {
		type: Sequelize.BOOLEAN,
		defaultValue: true,
	},
}
