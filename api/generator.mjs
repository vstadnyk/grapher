import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

import Proto from '../lib/__proto'
import Graphql from './graphql-loader'

const { graphql, introspectionQuery, printSchema } = Graphql

export default class extends Proto {
	constructor(parent) {
		super()

		this.parent = parent
	}
	get config() {
		const { downloadSchema } = this.parent.config

		return downloadSchema
	}
	async download(file = 'schema.json') {
		const { ctx } = this.parent
		const { path: dir } = this.config
		const schema = await this.parent.executableSchema()

		if (path.extname(file) === '.json') {
			const _schema = await graphql(schema, introspectionQuery)

			await promisify(fs.writeFile)(
				dir.concat(file),
				JSON.stringify(_schema, null, 2)
			)
		}

		if (path.extname(file) === '.graphql') {
			await promisify(fs.writeFile)(dir.concat(file), printSchema(schema))
		}

		ctx.status = 200
		ctx.body = fs.createReadStream(dir.concat(file))
		ctx.set(
			'Content-disposition',
			`attachment; filename= ${path.basename(file)}`
		)
	}
}
