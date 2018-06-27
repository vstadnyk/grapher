/**
 * Declaration resolver methods for Resolvers
 * @param  {method()} as Query
 * @param  {_method()} as Mutation
 * @param  {__method()} as private
 */

import graphqlFields from 'graphql-fields'

import Proto from '../__proto'
import Pusher from '../api/core/push/controller'

export default class Resolver extends Proto {
	constructor(schema = null, scalars = null) {
		super()

		this.schema = schema
		this.scalars = scalars
	}
	gFields(info) {
		return graphqlFields(info)
	}
	get __pusher() {
		return new Pusher()
	}
}
