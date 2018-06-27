import gql from 'graphql-tag'
import Sequelize from 'sequelize'

export const schema = gql`
	type Location {
		id: ID
		name: String
		lat: Float
		lng: Float
		country: String
		city: String
		street: String
		building: String
		description: String
		active: Boolean
		info: RowInfo
	}

	type Locations {
		count: Int
		rows: [Location]
	}

	extend type Query {
		location(input: GetLocationInput): Location
		locations(input: GetLocationInput): Locations
	}

	extend type Mutation {
		_addLocation(input: LocationInput): Boolean
		_editLocation(input: LocationInput, id: ID!): Boolean
		_removeLocation(id: [ID]!): Boolean
	}

	input LocationInput {
		"""
		If provided ? action = edit : action = add
		"""
		id: ID
		name: String
		lat: Float!
		lng: Float!
		building: String
		description: String
		active: Boolean
	}

	input GetLocationInput {
		id: [ID]
		name: [String]
		country: [String]
		city: [String]
		street: [String]
		active: Boolean
		params: Params
	}
`

export const fields = {
	name: {
		type: Sequelize.TEXT
	},
	country: {
		type: Sequelize.TEXT,
		translate: true
	},
	city: {
		type: Sequelize.TEXT,
		translate: true
	},
	street: {
		type: Sequelize.TEXT,
		translate: true
	},
	building: {
		type: Sequelize.TEXT
	},
	lat: {
		type: Sequelize.FLOAT
	},
	lng: {
		type: Sequelize.FLOAT
	},
	description: {
		type: Sequelize.TEXT
	},
	lang: {
		type: Sequelize.TEXT
	},
	translateTo: {
		type: Sequelize.INTEGER
	},
	active: {
		type: Sequelize.BOOLEAN,
		defaultValue: true
	}
}
