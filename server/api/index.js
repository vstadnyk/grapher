import fs from 'fs'
import path from 'path'
import {
	graphqlKoa as GraphqlServer,
	graphiqlKoa as Graphiql
} from 'apollo-server-koa'
import { makeExecutableSchema } from 'graphql-tools'
import {
	graphql,
	introspectionQuery,
	printSchema,
	execute,
	subscribe
} from 'graphql'

import { createServer } from 'https'
import { SubscriptionServer } from 'subscriptions-transport-ws'

import { renderPlaygroundPage } from 'graphql-playground-html'

import { api as config, server as serverConfig } from '../config'
import Resolver from './resolver'
import Loger from './loger'

export default class API {
	constructor() {
		this.resolver = new Resolver()
	}
	get __dev() {
		return !process.env.NODE_ENV || process.env.NODE_ENV === 'production'
	}
	get config() {
		return config
	}
	ws(schema, port, url) {
		const { ssl } = serverConfig
		const server = createServer(
			{
				key: fs.readFileSync(ssl.key).toString(),
				cert: fs.readFileSync(ssl.cert).toString()
			},
			(req, res) => {
				res.writeHead(404)
				res.end()
			}
		)

		try {
			server.listen(port)
		} catch (error) {
			throw new Error(`Error start ws: ${JSON.stringify(error)}`)
		}

		SubscriptionServer.create(
			{
				schema,
				execute,
				subscribe
			},
			{
				server,
				path: url
			}
		)

		return true
	}
	async initialize(router, context = {}) {
		const {
			ws: { port, url },
			endpointURL,
			graphiqlURL,
			executableOptions
		} = config

		const data = await this.resolver.getModels(context)
		const schema = makeExecutableSchema(
			Object.assign({}, data, executableOptions)
		)

		this.ws(schema, port, url)

		Object.assign(context, {
			pubsub: this.resolver.pubsub
		})

		await router
			.post(endpointURL, async ctx => {
				global.publicUrl = (ctx.req.connection.encrypted
					? 'https'
					: 'http'
				).concat('://', ctx.get('host'))

				await GraphqlServer({
					schema,
					context,
					tracing: false,
					rootValue: ctx,
					cacheControl: false,
					debug: false,
					formatResponse: params => {
						ctx.status = 200
						const { data: responce, errors } = params

						new Loger(ctx).logQuery({ responce, errors })

						return params
					},
					formatError: error => {
						const { message } = error

						new Loger(ctx).logError(error)

						return { message }
					}
				})(ctx)
			})
			.get(graphiqlURL, async ctx => {
				await Graphiql({
					endpointURL,
					subscriptionsEndpoint: `wss://${ctx
						.get('host')
						.split(':')
						.find(row => row)}:${port}${url}`
				})(ctx)
			})
			.get('/schema', async ctx => {
				const { schemaJSON, schemaFile } = config
				const _schema = await graphql(schema, introspectionQuery)

				fs.writeFileSync(schemaJSON, JSON.stringify(_schema, null, 2))

				if (schemaFile) {
					fs.writeFileSync(schemaFile, printSchema(schema))
				}

				ctx.status = 200
				ctx.body = fs.createReadStream(schemaJSON)
				ctx.set(
					'Content-disposition',
					`attachment; filename= ${path.basename(schemaJSON)}`
				)
			})
			.get('/playground', async (ctx, next) => {
				try {
					ctx.body = await renderPlaygroundPage({
						version: 'latest',
						endpoint: endpointURL,
						subscriptionEndpoint: `wss://${ctx
							.get('host')
							.split(':')
							.find(row => row)}:${port}${url}`
					})

					await next()
				} catch (error) {
					ctx.status = error.status || 500
					throw new Error(error)
				}
			})
	}
}
