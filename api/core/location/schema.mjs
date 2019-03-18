import gql from 'graphql-tag'
import Sequelize from 'sequelize'

import { gmap } from '../../../config'

export const config = gmap

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

	type Location_i18n {
		id: ID
		name: String
		lat: Float
		lng: Float
		country: [I18n]
		city: [I18n]
		street: [I18n]
		building: String
		description: String
		active: Boolean
		info: RowInfo
	}

	type Locations {
		count: Int
		rows: [Location]
	}

	type Locations_i18n {
		count: Int
		rows: [Location_i18n]
	}

	type GmapLocation {
		lat: Float
		lng: Float
		country: String
		city: String
		street: String
		building: String
		lang: String
	}

	extend type Query {
		location(input: GetLocationInput): Location
		locations(input: GetLocationInput): Locations
		location_i18n(input: GetLocationInput): Location_i18n
		locations_i18n(input: GetLocationInput): Locations_i18n

		gmapLocation(
			"""
			Default: appCoordLat & appCoordLng from header
			"""
			coord: GmapCoord
			"""
			Default: applang from header
			"""
			lang: String
		): GmapLocation
	}

	extend type Mutation {
		_addLocation(input: LocationInput): ID
		_editLocation(input: LocationInput, id: ID!): Boolean
		_removeLocation(id: [ID]!): Boolean
	}

	input LocationInput {
		"""
		? action = edit : action = add
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

	input GmapCoord {
		lat: Float!
		lng: Float!
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
