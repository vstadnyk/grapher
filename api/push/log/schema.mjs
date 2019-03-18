import gql from 'graphql-tag'
import Sequelize from 'sequelize'

export const schema = gql`
	type PushLog {
		id: ID
		user: ID
		event: String
		title: String
		body: String
		lang: String
		isNew: Boolean
		data: JSON
		info: RowInfo
	}

	type PushLogs {
		count: Int
		rows: [PushLog]
	}

	extend type Query {
		pushLog(input: GetPushLogInput): PushLog
		pushLogs(input: GetPushLogInput): PushLogs
		pushLogsTotal(input: GetPushLogInput): Int
	}

	extend type Mutation {
		_removePushLog(input: GetPushLogInput): Boolean
	}

	input GetPushLogInput {
		id: [ID]
		"""
		Default: current user.id
		"""
		user: [ID]
		event: [String]
		"""
		Default: appplatform
		"""
		platform: [String]
		"""
		Default: applang
		"""
		lang: [String]
		isNew: Boolean
		params: Params
	}
`

export const fields = {
	user: {
		type: Sequelize.INTEGER,
		allowNull: false
	},
	event: {
		type: Sequelize.TEXT
	},
	title: {
		type: Sequelize.TEXT
	},
	body: {
		type: Sequelize.TEXT
	},
	data: {
		type: Sequelize.JSON
	},
	lang: {
		type: Sequelize.TEXT
	},
	app: {
		type: Sequelize.TEXT
	},
	platform: {
		type: Sequelize.TEXT
	},
	isNew: {
		type: Sequelize.BOOLEAN,
		defaultValue: true
	}
}
