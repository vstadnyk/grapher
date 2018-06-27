import gql from 'graphql-tag'

export default gql`
	extend type Query {
		locales(
			"""
			Return key if not found
			"""
			key: String
			"""
			Language code <en> | <ar>
			Default: header.applang | config.locale.default (en)
			"""
			lang: String
		): JSON
	}

	extend type Mutation {
		"""
		Language code <en> | <ar>
		Default: header.applang | config.locale.default (en)
		"""
		_modifyLocale(input: JSON, lang: String): Boolean
	}

`
