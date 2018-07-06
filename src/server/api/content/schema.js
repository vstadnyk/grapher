import gql from 'graphql-tag'
import Sequelize from 'sequelize'

export const schema = gql`
	type Content {
		id: ID
		alias: String
		name: String
		description: String
		photo: File
		position: Int
		active: Boolean
		info: RowInfo
	}

	type Content_i18n {
		id: ID
		alias: String
		name: [I18n]
		description: [I18n]
		photo: File
		position: Int
		active: Boolean
		info: RowInfo
	}

	type Contents {
		count: Int
		rows: [Content]
	}

	type Contents_i18n {
		count: Int
		rows: [Content_i18n]
	}

	extend type Query {
		content(input: GetContentInput): Content
		contents(input: GetContentInput): Contents
		content_i18n(input: GetContentInput): Content_i18n
		contents_i18n(input: GetContentInput): Contents_i18n
	}

	extend type Mutation {
		_addContent(input: ContentInput): Boolean
		_editContent(input: ContentInput, id: ID!): Boolean
		_removeContent(id: [ID]!): Boolean
	}

	input ContentInput {
		alias: String
		name: [I18nInput]
		description: [I18nInput]
		photo: File
		position: Int
		active: Boolean
	}

	input GetContentInput {
		id: [ID]
		alias: [String]
		active: Boolean
		params: Params
	}
`

export const fields = {
	name: {
		type: Sequelize.TEXT,
		translate: true,
	},
	alias: {
		type: Sequelize.STRING,
	},
	description: {
		type: Sequelize.TEXT,
		translate: true,
	},
	photo: {
		type: Sequelize.TEXT,
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
	position: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
	},
}
