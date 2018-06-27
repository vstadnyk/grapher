import fs from 'fs'
import { promisify } from 'util'

import Proto from '../__proto'
import { api as config } from '../config'

export default class Loger extends Proto {
	constructor(ctx) {
		super()

		this.ctx = ctx
	}
	static get config() {
		return config.loger
	}
	get config() {
		return config.loger
	}
	header() {
		const {
			request: { header }
		} = this.ctx

		return header
	}
	async write(
		src = '',
		data = {},
		options = {
			addHeader: false,
			addDate: true
		}
	) {
		let str = null
		const { addHeader, addDate } = options
		const _data = Object.assign({}, data)

		try {
			str = await promisify(fs.readFile)(src, 'utf8')
		} catch (error) {
			str = null
		}

		const log = str ? JSON.parse(str) : []

		if (addDate)
			Object.assign(_data, {
				date: this.moment().format('YYYY-MM-DD HH:mm:ss')
			})

		if (addHeader)
			Object.assign(_data, {
				header: this.header()
			})

		log.push(_data)

		try {
			await promisify(fs.writeFile)(src, JSON.stringify(log, null, '\t'))
		} catch (error) {
			return null
		}

		return log
	}
	async logError(error) {
		const { extensions, stack = [] } = error
		const {
			errors: { file, enabled }
		} = this.config

		if (!enabled) return null

		await this.write(
			file,
			{
				extensions,
				stack: stack.split('\n').map(r => r.trim())
			},
			{
				addHeader: true
			}
		)

		return error
	}
	async logQuery(params) {
		const {
			queries: { enabled, file }
		} = this.config

		if (!enabled) return null

		await this.write(file, params)

		return params
	}
}
