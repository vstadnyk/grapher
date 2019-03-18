import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { EOL } from 'os'

import Proto from '../lib/__proto'
import { api as config } from '../config'

export default class Loger extends Proto {
	constructor(ctx = null) {
		super()

		if (ctx) this.ctx = ctx
	}
	static get config() {
		return config.loger
	}
	get config() {
		return config.loger
	}
	async append(file = null, data = {}) {
		if (!fs.existsSync(path.dirname(file)))
			await promisify(fs.mkdir)(path.dirname(file))

		if (!fs.existsSync(file)) await promisify(fs.writeFile)(file, '')

		await promisify(fs.appendFile)(
			file,
			JSON.stringify(data, null, '\t').concat(',', EOL)
		)
	}
	async write(src = '', data = {}, { merge = true } = {}) {
		const log = data

		if (merge) {
			this.read(src)
				.then(_log => {
					const _data = Object.assign({}, data)

					_log.push(_data)

					return _log
				})
				.then(_log =>
					promisify(fs.writeFile)(src, JSON.stringify(_log, null, '\t'))
				)
				.catch(error => console.log(error))
		} else {
			promisify(fs.writeFile)(src, JSON.stringify(log, null, '\t'))
		}

		return log
	}
	async clear(file = '') {
		await promisify(fs.writeFile)(file, '')

		return true
	}
	async read(file = '', json = true) {
		if (!fs.existsSync(path.resolve(file))) return []

		try {
			const log = await promisify(fs.readFile)(path.resolve(file), 'utf8')

			if (json) return JSON.parse(log || '[]')
			if (!json) return JSON.parse(`[${log.trim().slice(0, -1)}]`)
		} catch (error) {
			return []
		}

		return []
	}
	log(configKey = null, data = {}) {
		if (!configKey) return null

		const { file, ignore, logResults = true } = this.config[configKey] || {}

		if (!file) return null

		const apptype = this.ctx.get('apptype')
		const appplatform = this.ctx.get('appplatform')

		if (!logResults) delete data.result

		if (
			apptype &&
			ignore.apptype &&
			ignore.apptype.find(row => row === apptype)
		)
			return null

		if (
			appplatform &&
			ignore.appplatform &&
			ignore.appplatform.find(row => row === appplatform)
		)
			return null

		if (configKey === 'errors' && !ignore.types.find(r => r === data.type))
			this.append(file, data)

		if (
			configKey === 'queries' &&
			!data.selections.find(sel =>
				sel.query
					? ignore.query.find(r => r === sel.query)
					: ignore.mutation.find(r => r === sel.mutation)
			)
		)
			this.append(file, data)

		return true
	}
}
