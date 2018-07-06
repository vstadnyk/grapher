import gql from 'graphql-tag'
import moment from 'moment'

export const schema = gql`
	scalar JSON
	scalar DateTime
	scalar Time
	scalar File

	type RowInfo {
		id: ID
		active: Boolean
		createdAt: DateTime
		updatedAt: DateTime
	}

	type I18n {
		lang: String
		value: String
	}

	type Query {
		test: String
		serverTime: DateTime
		serverLog(type: String = "errors"): JSON
	}

	type Mutation {
		_test(text: String): String
		_clearServerLog(type: String = "errors"): Boolean
	}

	type Subscription {
		onTest: String
	}

	input Sort {
		"""
		sort by column <id | ...>
		"""
		column: String
		"""
		sort direction <DESC | ASC>
		"""
		direction: String
	}

	input Search {
		"""
		search by column <name | ...>
		"""
		column: String
		"""
		search by columns array [<name | ...>]
		"""
		columns: [String]
		"""
		LIKE '%hat'
		"""
		like: String
		"""
		NOT LIKE '%hat'
		"""
		notLike: String
		"""
		ILIKE '%hat' (case insensitive) (PG only)
		"""
		iLike: String
		"""
		NOT ILIKE '%hat' (case insensitive) (PG only)
		"""
		notILike: String
	}

	"""
	Query params to get list of items
	"""
	input Params {
		sort: Sort
		search: Search
		limit: Int
		offset: Int
	}

	input I18nInput {
		lang: String
		value: String
	}
`

export const scalars = {
	File: {
		description: `
			return url: <http | https>://<domain | IP>:<port><src>
		`,
		serialize: src => (global.publicUrl ? global.publicUrl.concat(src) : src),
	},
	DateTime: {
		description: `
			return date format <YYYY-MM-DD HH:mm:ss>
        `,
		serialize: v =>
			moment(v).isValid() ? moment(v).format('YYYY-MM-DD HH:mm:ss') : v,
		parseLiteral: ({ value }) => moment(value),
		parseValue: value => moment(value),
	},
	Time: {
		description: `
			return date format <HH:mm:ss>
		`,
		serialize: v => (moment(v).isValid() ? moment(v).format('HH:mm:ss') : v),
		parseLiteral: ({ value }) => moment(value),
	},
}
