import gql from 'graphql-tag'
import Sequelize from 'sequelize'

export const schema = gql`
	type MailTemplate {
		id: ID
		alias: String
		subject: String
		message: String
		wrapper: String
		variables: JSON
		active: Boolean
		info: RowInfo
	}

	type MailTemplate_i18n {
		id: ID
		alias: String
		subject: [I18n]
		message: [I18n]
		wrapper: String
		variables: JSON
		active: Boolean
		info: RowInfo
	}

	type MailTemplates {
		count: Int
		rows: [MailTemplate]
	}

	type MailTemplates_i18n {
		count: Int
		rows: [MailTemplate_i18n]
	}

	extend type Query {
		mailTemplate(input: GetMailTemplate): MailTemplate
		mailTemplates(input: GetMailTemplate): MailTemplates
		mailTemplate_i18n(input: GetMailTemplate): MailTemplate_i18n
		mailTemplates_i18n(input: GetMailTemplate): MailTemplates_i18n
	}

	extend type Mutation {
		_addMailTemplate(input: MailTemplateInput): Boolean
		_editMailTemplate(id: ID!, input: MailTemplateInput): Boolean
		_removeMailTemplate(id: [ID]!): Boolean
	}

	input MailTemplateInput {
		alias: String
		subject: [I18nInput]
		message: [I18nInput]
		wrapper: String
		variables: JSON
		active: Boolean
	}

	input GetMailTemplate {
		id: [ID]
		alias: [String]
		active: Boolean
		wrapper: [String]
		params: Params
	}
`

export const fields = {
	alias: {
		type: Sequelize.TEXT
	},
	subject: {
		type: Sequelize.TEXT,
		translate: true
	},
	message: {
		type: Sequelize.TEXT,
		translate: true
	},
	variables: {
		type: Sequelize.JSON
	},
	wrapper: {
		type: Sequelize.TEXT,
		defaultValue: 'default'
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
