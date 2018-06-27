import fs from 'fs'
import { promisify } from 'util'

import Proto from '../../proto/resolver'

import { schema, scalars } from './schema'
import Loger from '../loger'

export default class extends Proto {
	constructor() {
		super(schema, scalars)
	}
	subscribe(pubsub) {
		return {
			onTest: {
				subscribe: () => pubsub.asyncIterator('Test')
			}
		}
	}
	test() {
		return '😃 it works!'
	}
	serverTime() {
		return this.moment()
	}
	_test(ctx, { text }, { pubsub }) {
		const _text = text || '🤪 empty string'

		pubsub.publish('Test', {
			onTest: _text
		})

		return _text
	}
	async serverLog(ctx, { type = 'errors' }) {
		const { enabled, file } = Loger.config[type] || {}

		if (!enabled) return false

		try {
			return JSON.parse(await promisify(fs.readFile)(file, 'utf8')).filter(
				row =>
					row.responce
						? Object.keys(row.responce).find(v => v !== 'serverLog')
						: row
			)
		} catch (error) {
			return null
		}
	}
	async _clearServerLog(ctx, { type = 'errors' }) {
		const { enabled, file } = Loger.config[type] || {}

		if (!enabled) return false

		try {
			await promisify(fs.writeFile)(file, '')
		} catch (error) {
			throw new Error(error)
		}

		return true
	}
}
