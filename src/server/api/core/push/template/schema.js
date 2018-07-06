import gql from 'graphql-tag'
import Sequelize from 'sequelize'

import { pushServer } from '../../../../../config'

export const config = pushServer

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
		body: [I18n]
		title: [I18n]
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
		_editPushTemplate(input: PushTemplateInput, id: ID!): Boolean
		_removePushTemplate(id: [ID]!): Boolean
	}

	input PushTemplateInput {
		event: String
		body: [I18nInput]
		title: [I18nInput]
		app: String
		platform: String
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
		type: Sequelize.TEXT,
	},
	app: {
		type: Sequelize.TEXT,
	},
	platform: {
		type: Sequelize.TEXT,
	},
	body: {
		type: Sequelize.TEXT,
		translate: true,
	},
	title: {
		type: Sequelize.TEXT,
		translate: true,
	},
	active: {
		type: Sequelize.BOOLEAN,
		defaultValue: true,
	},
	lang: {
		type: Sequelize.TEXT,
	},
	translateTo: {
		type: Sequelize.INTEGER,
	},
}
