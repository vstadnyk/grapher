import gql from 'graphql-tag'
import Sequelize from 'sequelize'

export const schema = gql`
	scalar Gender

	type User {
		id: ID
		mail: String
		loginAt: DateTime
		firstName: String
		lastName: String
		fullName: String
		displayName: String
		phone: String
		gender: Gender
		photo: File
		locations: [ID]
		locationsType: [Location]
		role: String
		permission: Permission
		registerWith: String
		createdAt: DateTime
		updatedAt: DateTime
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
		photo: File
		gender: Gender
	}

	input ProfileInput {
		phone: String
		firstName: String
		lastName: String
		fullName: String
		displayName: String
		photo: File
		gender: Gender
	}

	input UserInput {
		mail: String
		pass: String
		phone: String
		firstName: String
		lastName: String
		fullName: String
		displayName: String
		gender: Gender
		photo: File
		location: [ID]
		"""
		Permission.alias
		"""
		permission: String
	}

	input GetUser {
		id: [ID]
		mail: [String]
		permission: [ID]
		gender: [Gender]
		active: Boolean
		params: Params
	}
`

export const scalars = {
	Gender: {
		description: `
			User gender:
			0 - Not set
			1 - Male
			2 - Fimale
		`,
		serialize: (gender, { locale }) =>
			locale && locale.get ? locale.get(`gender_${gender}`) : gender,
		parseLiteral: ({ value, kind }) => {
			if (kind === 'IntValue') return value
			if (!Number.isNaN(value)) return Number(value)

			throw new Error('Only Integer')
		},
		parseValue: value => {
			if (!Number.isNaN(value)) return Number(value)

			throw new Error('Only Integer')
		},
	},
}

export const fields = {
	rid: {
		// user id from auth db
		type: Sequelize.STRING,
		allowNull: false,
		isUnique: true,
	},
	permission: {
		type: Sequelize.INTEGER,
		allowNull: false,
	},
	mail: {
		type: Sequelize.STRING,
		allowNull: false,
		unique: true,
		validate: {
			isEmail: true,
		},
	},
	firstName: {
		type: Sequelize.TEXT,
	},
	lastName: {
		type: Sequelize.TEXT,
	},
	fullName: {
		type: Sequelize.TEXT,
	},
	displayName: {
		type: Sequelize.TEXT,
	},
	gender: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
	},
	locations: {
		type: Sequelize.JSON,
	},
	phone: {
		type: Sequelize.TEXT,
	},
	photo: {
		type: Sequelize.TEXT,
	},
	active: {
		type: Sequelize.BOOLEAN,
		defaultValue: true,
	},
	loginAt: {
		type: Sequelize.DATE,
	},
	registerWith: {
		type: Sequelize.TEXT,
		defaultValue: 'normal',
	},
}
