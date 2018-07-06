import { fields } from './schema'
import User from '../../../user/controller'
import Controller from '../../../../proto/controller'

export default class extends Controller {
	get force() {
		return false
	}
	get table() {
		return 'push-logs'
	}
	get fields() {
		return fields
	}
	get user() {
		return new User().use(this.db, this.auth, this.locale)
	}
	async validateWhere(where = {}) {
		if (!where.user) {
			const user = await this.user.current()

			Object.assign(where, {
				user: user.id,
			})
		}

		return where
	}
	async pushLog(where = {}) {
		await this.validateWhere(where)

		const item = await this.one(where)

		if (!item) return item

		this.formatLog(item)

		return item
	}
	async pushLogs(where = {}) {
		await this.validateWhere(where)

		const list = await this.list(where)

		if (!list || !list.count) return list

		Object.assign(list, {
			rows: list.rows
				.map(row => (row.get ? row.get() : row))
				.map(this.formatLog),
		})

		for (const { id } of list.rows) {
			await this.edit(
				{
					id,
				},
				{
					isNew: false,
				},
			)
		}

		return list
	}
	formatLog(item) {
		Object.assign(item, {
			createdAt: this.dateToString(item.createdAt),
			updatedAt: this.dateToString(item.updatedAt),
		})

		return item
	}
	async remove(id, where = {}) {
		if (id) {
			Object.assign(where, {
				id,
			})
		}

		if (!where.user) {
			const { id: user } = await this.user.current()

			Object.assign(where, {
				user,
			})
		}

		await this.model.destroy({
			where,
		})

		return true
	}
}
