import glob from 'glob'
import path from 'path'
import { promisify } from 'util'
import { GraphQLScalarType, GraphQLNonNull, GraphQLInt } from 'graphql'

import Proto from '../lib/__proto'
import ProtoResolver from '../lib/proto/resolver'
import Loger from './loger'

export default class Resolver extends Proto {
	constructor() {
		super()

		this.typeDefs = []
		this.resolvers = {
			Query: {},
			Mutation: {},
			Subscription: {}
		}
	}
	get loger() {
		return new Loger()
	}
	async getResolvers(context = {}) {
		const list =
			(await promisify(glob)(
				this.__dirname(import.meta).concat('/**/resolver.mjs')
			)) || []

		try {
			const _resolvers = await Promise.all(
				list.map(file => path.resolve(file)).map(file => import(file))
			)

			_resolvers
				.filter(({ default: R }) => R.prototype instanceof ProtoResolver)
				.forEach(({ default: R }) => {
					const { schema } = this.setResolver(new R().use(this.loger), context)

					this.typeDefs.push(schema || '')
				})
		} catch (error) {
			throw error
		}

		const { resolvers, typeDefs } = this

		return { resolvers, typeDefs }
	}
	setResolver(resolver, context) {
		;[...resolver.__methods]
			.filter(fn => typeof fn === 'function' && fn.name)
			.forEach(fn => {
				if (fn.name.indexOf('subscribe') === 0) {
					Object.assign(this.resolvers.Subscription, fn(context.pubsub))
				} else {
					const q = fn.name.indexOf('_') === 0 ? 'Mutation' : 'Query'

					Object.assign(this.resolvers[q], {
						[fn.name]: fn.bind(resolver)
					})
				}

				if (resolver.scalars) {
					for (const [name, scalar] of Object.entries(resolver.scalars)) {
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
											scalar.serialize ? scalar.serialize(a, context) : a,
										parseValue: a =>
											scalar.parseValue ? scalar.parseValue(a, context) : a,
										parseLiteral: a =>
											scalar.parseLiteral ? scalar.parseLiteral(a, context) : a
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
