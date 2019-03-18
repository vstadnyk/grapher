import { fields } from './schema'
import User from '../../user/controller'
import Controller from '../../../lib/proto/controller'
import Joiner from './joiner'

export default class extends Controller {
	get table() {
		return 'push-logs'
	}
	get fields() {
		return fields
	}
	get user() {
		return new User().use(this.db, this.auth, this.locale)
	}
	get joiner() {
		return new Joiner(this)
	}
	async validateWhere(where = {}) {
		if (!where.user) {
			const { id: user } = await this.user.current()

			if (user) Object.assign(where, { user })
		}

		if (!where.lang) Object.assign(where, { lang: this.locale.current })

		if (!where.platform) {
			const platform = this.api.ctx.get('appplatform')

			if (platform) Object.assign(where, { platform })
		}

		return where
	}
	async log(where = {}, options = {}) {
		await this.validateWhere(where)

		const item = await this.one(where)

		await this.joiner.join(item, options)

		await this.edit(where, { isNew: false })

		return item
	}
	async logs(where = {}, options = {}) {
		await this.validateWhere(where)

		const list = await this.list(where)

		if (!list) return null

		const rows = await Promise.all(
			list.rows.map(row => this.joiner.join(row, options))
		)

		Object.assign(list, { rows })

		await this.edit(where, { isNew: false })

		return list
	}
}
