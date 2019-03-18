import gql from 'graphql-tag'
import Sequelize from 'sequelize'

export const schema = gql`
	type PushTemplate {
		id: ID
		event: String
		app: String
		platform: String
		body: String
		title: String
		active: Boolean
		info: RowInfo
	}

	type PushTemplate_i18n {
		id: ID
		event: String
		app: String
		platform: String
		title: [I18n]
		body: [I18n]
		active: Boolean
		info: RowInfo
	}

	type PushTemplates {
		count: Int
		rows: [PushTemplate]
	}

	type PushTemplates_i18n {
		count: Int
		rows: [PushTemplate_i18n]
	}

	extend type Query {
		pushTemplate(input: GetPushTemplateInput): PushTemplate
		pushTemplates(input: GetPushTemplateInput): PushTemplates
		pushTemplate_i18n(input: GetPushTemplateInput): PushTemplate_i18n
		pushTemplates_i18n(input: GetPushTemplateInput): PushTemplates_i18n
	}

	extend type Mutation {
		_addPushTemplate(input: PushTemplateInput): Boolean
		_editPushTemplate(id: ID!, input: PushTemplateInput): Boolean
		_removePushTemplate(id: [ID]!): Boolean
	}

	input PushTemplateInput {
		event: String
		app: String
		platform: String
		title: [I18nInput]
		body: [I18nInput]
		active: Boolean
	}

	input GetPushTemplateInput {
		id: [ID]
		event: [String]
		app: [String]
		platform: [String]
		active: Boolean
		params: Params
	}
`

export const fields = {
	event: {
		type: Sequelize.TEXT
	},
	app: {
		type: Sequelize.TEXT
	},
	platform: {
		type: Sequelize.TEXT
	},
	title: {
		type: Sequelize.TEXT,
		translate: true
	},
	body: {
		type: Sequelize.TEXT,
		translate: true
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
