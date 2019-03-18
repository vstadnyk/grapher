import gql from 'graphql-tag'
import { mailer } from '../../../config'

export const config = mailer

export default gql`
	extend type Query {
		mailConfig(key: String): JSON
	}

	extend type Mutation {
		_sendMail(input: MailerInput!): Boolean
	}

	input MailerUser {
		name: String
		mail: String
	}

	input MailerInput {
		to: MailerUser
		variables: JSON
		"""
		Default: mailer.config.main.from
		"""
		from: MailerUser
		"""
		Default: mailer.config.main.subject
		"""
		subject: String
		"""
		Default: mailer.config.main.message
		"""
		message: String
		"""
		Default: mailer.config.template.defTmpl (<message.html>)
		"""
		template: String
		"""
		from MailTemplates db
		"""
		alias: String
		"""
		Default: appLang from header
		"""
		lang: String
	}
`
