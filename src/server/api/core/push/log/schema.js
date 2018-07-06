import gql from 'graphql-tag'
import Sequelize from 'sequelize'

export const schema = gql`
	type PushLog {
		id: ID
		user: ID
		event: String
		title: String
		body: String
		execut: String
		args: String
		isNew: Boolean
		createdAt: String
		updatedAt: String
	}

	type PushLogs {
		count: Int
		rows: [PushLog]
	}

	extend type Query {
		pushLog(input: GetPushLogInput): PushLog
		pushLogs(input: GetPushLogInput): PushLogs
	}

	extend type Mutation {
		_removePushLog(id: [ID], input: GetPushLogInput): Boolean
	}

	input GetPushLogInput {
		id: [ID]
		"""
		Default: current user.id
		"""
		user: [ID]
		event: [String]
		params: Params
	}
`

export const fields = {
	user: {
		type: Sequelize.INTEGER,
		allowNull: false,
	},
	event: {
		type: Sequelize.TEXT,
		allowNull: false,
	},
	title: {
		type: Sequelize.TEXT,
	},
	body: {
		type: Sequelize.TEXT,
	},
	execut: {
		type: Sequelize.TEXT,
	},
	args: {
		type: Sequelize.TEXT,
	},
	isNew: {
		type: Sequelize.BOOLEAN,
		defaultValue: true,
	},
}
