import path from 'path'
import glob from 'glob'
import { promisify } from 'util'
import { GraphQLScalarType, GraphQLNonNull, GraphQLInt } from 'graphql'

import { PubSub } from 'graphql-subscriptions'

import ProtoResolver from '../proto/resolver'
import Loger from './loger'

export default class Resolver {
	constructor() {
		this.typeDefs = []
		this.resolvers = {
			Query: {},
			Mutation: {},
			Subscription: {}
		}
		this._pubsub = new PubSub()
	}
	get pubsub() {
		return this._pubsub
	}
	get loger() {
		return new Loger()
	}
	async getModels(context = {}) {
		for (const file of await promisify(glob)(
			path.join(__dirname, '/**/resolver.js')
		)) {
			const { default: R } = await import(file)

			if (R.prototype instanceof ProtoResolver) {
				const { schema } = this.setResolver(new R().use(this.loger), context)

				this.typeDefs.push(schema || '')
			}
		}

		const { resolvers, typeDefs } = this

		return {
			resolvers,
			typeDefs
		}
	}
	setResolver(resolver, context) {
		;[...resolver.__methods]
			.filter(fn => typeof fn === 'function' && fn.name)
			.forEach(fn => {
				let q = 'Query'
				
				if (fn.name.indexOf('_') === 0) q = 'Mutation'

				if (fn.name.indexOf('subscribe') === 0) {
					Object.assign(this.resolvers.Subscription, fn(this.pubsub))
				} else {
					Object.assign(this.resolvers[q], {
						[fn.name]: fn.bind(resolver)
					})
				}

				if (resolver.scalars) {
					for (const [name, scalar] of Object.entries(
						resolver.scalars
					)) {
						Object.assign(this.resolvers, {
							[name]: new GraphQLScalarType(
								Object.assign(
									{},
									{
										name,
										description: 'Not provided',
										type: new GraphQLNonNull(GraphQLInt)
									},
									{
										serialize: a =>
											scalar.serialize
												? scalar.serialize(a, context)
												: a,
										parseValue: a =>
											scalar.parseValue
												? scalar.parseValue(a, context)
												: a,
										parseLiteral: a =>
											scalar.parseLiteral
												? scalar.parseLiteral(
														a,
														context
												  )
												: a
									}
								)
							)
						})
					}
				}
			})

		return resolver
	}
}
