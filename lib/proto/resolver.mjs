/**
 * Declaration resolver methods for Resolvers
 * @param  {method()} as Query
 * @param  {_method()} as Mutation
 * @param  {__method()} as private
 */

import graphqlFields from 'graphql-fields'

import Proto from '../__proto'

export default class Resolver extends Proto {
	constructor(schema = null, scalars = null) {
		super()

		this.schema = schema
		this.scalars = scalars
	}
	gFields(info) {
		return graphqlFields(info)
	}
}
