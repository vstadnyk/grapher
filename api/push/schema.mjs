import gql from 'graphql-tag'
import Sequelize from 'sequelize'

import { pushServer } from '../../config'

export const config = pushServer

export const schema = gql`
	type PushSubscriber {
		id: ID
		token: String
		user: ID
		userFull: User
		event: String
		app: String
		platform: String
		lang: String
		active: Boolean
		info: RowInfo
	}

	type PushSubscribers {
		count: Int
		rows: [PushSubscriber]
	}

	extend type Query {
		pushSubscriber(input: GetSubscribePushInput): PushSubscriber
		pushSubscribers(input: GetSubscribePushInput): PushSubscribers
		pushTest(
			event: String = "onTest"
			users: [ID]
			"""
			Variables for template
			"""
			vars: JSON
			"""
			Extra data
			"""
			data: JSON
		): Boolean
		pushTemplateData: JSON
	}

	extend type Mutation {
		"""
		Doc: https://docs.google.com/spreadsheets/d/1eVHAfqkirKAZn9WnWqfy3iyBPfSXUVIsG1aRbXKbL1w/edit#gid=1407615663
		"""
		_subscribePush(input: SubscribePushInput): Boolean
		_removeSubscribePush(input: GetSubscribePushInput): Boolean
	}

	input SubscribePushInput {
		"""
		Array of event name
		[<onTest>, ...]
		"""
		events: [String]
		"""
		Registration token from FireBase
		"""
		token: String!
		"""
		Message language
		<en> | <ar>
		Default: applang from header
		"""
		lang: String
		"""
		<admin> | <customer>
		Default: apptype from header
		"""
		app: String
		"""
		<android> | <ios> | <web>
		Default: appplatform from header
		"""
		platform: String
		"""
		Default: current user id
		"""
		user: ID
		active: Boolean = true
	}

	input GetSubscribePushInput {
		id: [ID]
		event: [String]
		app: [String]
		platform: [String]
		user: [ID]
		lang: [String]
		active: Boolean
		params: Params
	}
`

export const fields = {
	token: {
		type: Sequelize.STRING,
		allowNull: false
	},
	user: {
		type: Sequelize.INTEGER,
		allowNull: false
	},
	event: {
		type: Sequelize.TEXT
	},
	app: {
		type: Sequelize.TEXT
	},
	platform: {
		type: Sequelize.TEXT
	},
	lang: {
		type: Sequelize.TEXT
	},
	active: {
		type: Sequelize.BOOLEAN,
		defaultValue: true
	}
}
