import gql from 'graphql-tag'
import Sequelize from 'sequelize'

export const schema = gql`
	type User {
		id: ID
		mail: String
		loginAt: DateTime
		firstName: String
		lastName: String
		fullName: String
		displayName: String
		phone: String
		photo: File
		locations: [ID]
		locationsFull: [Location]
		defaultLocation: ID
		defaultLocationFull: Location
		role: String
		permission: Permission
		registerWith: String
		active: Boolean
		info: RowInfo
	}

	type Tokens {
		accessToken: String
		refreshToken: String
	}

	type LoginOutput {
		tokens: Tokens
		user: User
	}

	type Users {
		count: Int
		rows: [User]
	}

	extend type Query {
		"""
		return current user if input not set
		"""
		user(input: GetUser): User
		users(input: GetUser): Users
		"""
		Check accessToken
		"""
		ping: Boolean
	}

	extend type Mutation {
		_register(input: RegisterInput!): User
		_login(mail: String!, pass: String!): LoginOutput
		_logout: Boolean
		_refreshToken(refreshToken: String!): Tokens
		_forgotPass(mail: String!): Boolean
		_changePass(pass: String!, currentPass: String, id: ID): Boolean
		_editProfile(input: ProfileInput): User
		_addUser(input: UserInput): Boolean
		_editUser(input: UserInput, id: ID!): Boolean
		_editUserStatus(
			id: ID!
			status: Boolean = false
			mailer: MailerInput
		): Boolean
		_removeUser(input: GetUser): Boolean
	}

	input RegisterInput {
		mail: String!
		pass: String!
		phone: String
		firstName: String
		lastName: String
		fullName: String
		displayName: String
		photo: String
	}

	input ProfileInput {
		phone: String
		firstName: String
		lastName: String
		fullName: String
		displayName: String
		photo: File
		locations: [ID]
		defaultLocation: ID
		locationInput: LocationInput
	}

	input UserInput {
		mail: String
		pass: String
		phone: String
		firstName: String
		lastName: String
		fullName: String
		displayName: String
		photo: String
		locations: [ID]
		defaultLocation: ID
		"""
		Permission.alias
		"""
		permission: String
	}

	input LoginSocialInput {
		mail: String!
		"""
		Can be any unique shit
		"""
		socialUserID: String!
		phone: String
		registerWith: String = "social"
		firstName: String
		lastName: String
		fullName: String
		"""
		url to user image from social network
		https://social.network/user.jpg
		"""
		photo: String
	}

	input GetUser {
		id: [ID]
		mail: [String]
		rid: [String]
		permission: [ID]
		active: Boolean
		params: Params
	}
`

export const fields = {
	rid: {
		// user id from auth db
		type: Sequelize.STRING,
		allowNull: false,
		isUnique: true
	},
	permission: {
		type: Sequelize.INTEGER,
		allowNull: false
	},
	mail: {
		type: Sequelize.STRING,
		allowNull: false,
		unique: true,
		validate: {
			isEmail: true
		}
	},
	firstName: {
		type: Sequelize.TEXT
	},
	lastName: {
		type: Sequelize.TEXT
	},
	fullName: {
		type: Sequelize.TEXT
	},
	displayName: {
		type: Sequelize.TEXT
	},
	defaultLocation: {
		type: Sequelize.TEXT
	},
	locations: {
		type: Sequelize.JSON
	},
	phone: {
		type: Sequelize.TEXT
	},
	photo: {
		type: Sequelize.TEXT,
		image: true
	},
	active: {
		type: Sequelize.BOOLEAN,
		defaultValue: true
	},
	loginAt: {
		type: Sequelize.DATE
	},
	registerWith: {
		type: Sequelize.TEXT,
		defaultValue: 'normal'
	}
}
