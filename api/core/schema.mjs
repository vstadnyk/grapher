import moment from 'moment'
import gql from 'graphql-tag'

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
		createdAtString: String
		updatedAtString: String
	}

	type I18n {
		lang: String
		value: String
	}

	type Query {
		test: String
	}

	type Mutation {
		_test(text: String): String
	}

	type Subscription {
		onTest: String
	}

	input Order {
		"""
		sort by column <id | ...>
		"""
		column: String
		"""
		sort direction <DESC | ASC>
		"""
		sort: String
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
		order: Order
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
		serialize: src => (global.publicUrl ? global.publicUrl.concat(src) : src)
	},
	DateTime: {
		description: `
			return date format <YYYY-MM-DD HH:mm:ss>
        `,
		serialize: v =>
			moment(v || null).isValid() ? moment(v).format('YYYY-MM-DD HH:mm:ss') : v,
		parseLiteral: ({ value }) => {
			if (value === '') return null

			return moment(value).isValid() ? moment(value) : value
		},
		parseValue: value => (moment(value).isValid() ? moment(value) : value)
	},
	Time: {
		description: `
			return date format <HH:mm:ss>
		`,
		serialize: v =>
			moment(
				moment()
					.format('YYYY-MM-DD')
					.concat(' ', v)
			).format('HH:mm:ss'),
		parseLiteral: ({ value }) => {
			if (value === '') return null

			return moment(
				moment()
					.format('YYYY-MM-DD')
					.concat(' ', value)
			).format('HH:mm:ss')
		}
	}
}
