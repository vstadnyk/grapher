import { EOL } from 'os'
import GraphqlHTTP from 'koa-graphql'
import GraphqlTools from 'graphql-tools'
import GraphqlPlayground from 'graphql-playground-html'
import GraphqlSubscriptions from 'graphql-subscriptions'
import SubscriptionsTransport from 'subscriptions-transport-ws'

import { api as config, jwt } from '../config'
import Graphql from './graphql-loader'
import Proto from '../lib/__proto'
import Generator from './generator'
import Resolver from './resolver'
import Loger from './loger'

export default class API extends Proto {
	constructor() {
		super()

		this.ctx = null
		this._schema = null
		this._pubsub = null
		this._context = {}
	}
	get config() {
		return config
	}
	get resolver() {
		return new Resolver()
	}
	get loger() {
		return new Loger(this.ctx)
	}
	get generator() {
		return new Generator(this)
	}
	get endpoint() {
		const { endpoint = '/api' } = this.config || {}

		return endpoint
	}
	get subscriptionUrl() {
		const {
			endpoint,
			ctx,
			ctx: {
				req: {
					connection: { encrypted }
				}
			}
		} = this

		return `${encrypted ? 'wss' : 'ws'}://${ctx.get('host')}${endpoint}`
	}
	async schema() {
		if (this._schema) return this._schema

		this._schema = await this.resolver.getResolvers(this.context)

		return this._schema
	}
	async executableSchema() {
		const { makeExecutableSchema } = GraphqlTools

		const schema = await this.schema()

		return makeExecutableSchema(schema)
	}
	get context() {
		const {
			server: { db, auth, locale },
			loger,
			pubsub,
			ctx
		} = this

		this._context = {
			db,
			auth,
			locale,
			loger,
			pubsub,
			ctx,
			api: this
		}

		return this._context
	}
	get pubsub() {
		if (this._pubsub) return this._pubsub

		const { PubSub } = GraphqlSubscriptions

		this._pubsub = new PubSub()

		return this._pubsub
	}
	async subscriptionServer(server) {
		const {
			SubscriptionServer: { create }
		} = SubscriptionsTransport

		const { execute, subscribe } = Graphql

		const schema = await this.executableSchema()

		create(
			{
				schema,
				execute,
				subscribe
			},
			{ server, path: this.endpoint }
		)
	}
	preFormatError(error) {
		const {
			message,
			stack,
			path,
			originalError: {
				type = error.path
					? 'INTERNAL_SERVER_ERROR'
					: 'GRAPHQL_VALIDATION_FAILED',
				dump,
				status
			} = {}
		} = error

		return {
			message,
			stack: stack.split(EOL).map(r => r.trim()),
			path,
			type,
			dump,
			status
		}
	}
	formatError(error, ctx) {
		const {
			message,
			type,
			stack,
			status = null,
			dump = null
		} = this.preFormatError(error)

		console.log('Error', {
			type,
			message,
			stack,
			dump,
			errorStatus: status,
			ctxStatus: ctx.status
		})

		if (status) ctx.status = status

		return { type, message, dump }
	}
	logerGraphql({ document, variables, operationName, result }) {
		if (result.error || !document.definitions) return
		if (operationName === 'IntrospectionQuery') return
		if (process.env.NODE_ENV === 'production') return

		const { ignoreQueries = [] } = this.loger.config

		const selections = []
		const fragments = []

		const header = {
			date: this.moment().format('YYYY-MM-DD HH:mm:ss.SSS')
		}

		Object.keys(jwt.instance)
			.concat(jwt.headerKey)
			.forEach(key => {
				Object.assign(header, {
					[key]: this.ctx.get(key) || null
				})
			})

		document.definitions.forEach(
			({ kind, typeCondition, operation, selectionSet }) => {
				if (kind === 'FragmentDefinition') {
					const on = typeCondition.name.value
					const fields = []

					selectionSet.selections.forEach(({ name: { value } }) => {
						fields.push(value)
					})

					fragments.push({
						on,
						fields
					})
				} else {
					selectionSet.selections.forEach(({ name: { value } }) => {
						if (!ignoreQueries.find(r => r === value)) {
							selections.push({
								[operation]: value
							})
						}
					})
				}
			}
		)

		const log = Object.assign({}, header, {
			operationName,
			selections,
			fragments,
			variables
		})

		if (result.errors && result.errors.length) {
			result.errors.forEach(error => {
				const { type, stack } = this.preFormatError(error)

				this.loger.log('errors', Object.assign({}, { type, stack }, log))
			})
		} else {
			this.loger.log('queries', Object.assign({}, { result }, log))
		}
	}
	middleware() {
		return async (ctx, next) => {
			this.ctx = ctx

			await next()
		}
	}
	async start() {
		const {
			endpoint,
			config: {
				downloadSchema: {
					json: downloadSchemaJSON,
					graphql: downloadSchemaGraphql
				}
			}
		} = this

		await this.schema()

		this.server.router
			.post(endpoint, async (ctx, next) => {
				await this.init()

				await next()
			})
			.get(endpoint, async (ctx, next) => {
				await this.playground()

				await next()
			})
			.get(downloadSchemaJSON, async (ctx, next) => {
				await this.generator.download(downloadSchemaJSON)

				await next()
			})
			.get(downloadSchemaGraphql, async (ctx, next) => {
				await this.generator.download(downloadSchemaGraphql)

				await next()
			})
	}
	async init() {
		const { context, ctx } = this

		const schema = await this.executableSchema()

		await GraphqlHTTP({
			schema,
			context,
			formatError: error => this.formatError(error, ctx),
			extensions: query => this.logerGraphql(query)
		})(ctx)
	}
	async playground() {
		const {
			endpoint,
			subscriptionUrl: subscriptionEndpoint,
			config: { playgroundIDE }
		} = this

		const { renderPlaygroundPage } = GraphqlPlayground

		this.ctx.body = await renderPlaygroundPage(
			Object.assign({}, playgroundIDE, {
				endpoint,
				subscriptionEndpoint
			})
		)
	}
}
