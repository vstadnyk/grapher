import gql from 'graphql-tag'
import Sequelize from 'sequelize'

import {
    pushServer
} from '../../../config'

export const config = pushServer

export const schema = gql `
	extend type Query {
		pushTest(title: String!, body: String!): Boolean
	}

	extend type Mutation {
		_subscribePush(input: SubscribePushInput): Boolean
		_removeSubscribePush(input: GetSubscribePushInput): Boolean
	}

	input SubscribePushInput {
		event: String!
		token: String
		"""
		Message language
		<en> | <ar>
		Default: applang from header
		"""
		lang: String
		"""
		<android> | <ios> | <web>
		Default: admin
		"""
		platform: String!
		"""
		Any extra data send to device
		"""
		execut: String
	}

	input GetSubscribePushInput {
		id: [ID]
		event: [String]
		app: [String]
		platform: [String]
		"""
		Default: current user.id
		"""
		user: [ID]
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
    execut: {
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