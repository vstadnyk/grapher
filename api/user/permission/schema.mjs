import gql from 'graphql-tag'
import Sequelize from 'sequelize'

export const schema = gql`
	type Permission {
		id: ID
		name: String
		alias: String
		rules: JSON
		active: Boolean
		info: RowInfo
	}

	type Permissions {
		count: Int
		rows: [Permission]
	}

	extend type Query {
		permission(input: GetPermissionsInput): Permission
		permissions(input: GetPermissionsInput): Permissions
		permissionsAvailable: JSON
	}

	extend type Mutation {
		_addUserPermission(input: PermissionInput): Boolean
		_editUserPermission(input: PermissionInput, id: ID!): Boolean
		_removeUserPermission(id: [ID]!): Boolean
		_addUserPermissionRule(
			input: PermissionRuleInput
			where: GetPermissionsInput
		): Boolean
		_addUserPermissionRulesAll(input: GetPermissionsInput): Boolean
	}

	input PermissionInput {
		name: String
		alias: String
		rules: JSON
		active: Boolean
	}

	input PermissionRuleInput {
		key: String
		value: Boolean
	}

	input GetPermissionsInput {
		id: [ID]
		alias: [String]
		params: Params
		active: Boolean
	}
`

export const fields = {
	name: {
		type: Sequelize.STRING
	},
	alias: {
		type: Sequelize.STRING,
		unique: true,
		allowNull: false
	},
	rules: {
		type: Sequelize.JSON
	},
	active: {
		type: Sequelize.BOOLEAN,
		defaultValue: true
	}
}
