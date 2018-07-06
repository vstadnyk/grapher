import Controller from '../../proto/controller'

export default class extends Controller {
	constructor(parent) {
		super()

		this.parent = parent
	}
	async data(data, ignore = [], user) {
		for (const [name, field] of Object.entries(this.parent.fields)) {
			if (this.has(name) && ignore.indexOf(name) === -1)
				await this[name](data, field, user)
		}

		return data
	}
	async location(data, field, user) {
		const { locationInput } = data

		if (locationInput) {
			const { id } = await this.parent.location.modifyLocation(locationInput, {
				addToUser: user ? { id: user.id } : false,
			})

			if (!user) Object.assign(data, { location: [id] })
		}

		return data
	}
	async mail(data, field) {
		if (field.allowNull !== false) return data

		const { mail } = data

		if (
			await this.parent.exist({
				mail,
			})
		)
			throw new Error(
				this.parent.locale.get(`${this.parent.table}_error_email_exists`),
			)

		return data
	}
	async permission(data, field, user = false) {
		if (field.allowNull !== false || (user && !user.permission)) return data

		const { permission } = data

		const perm = await this.parent.permissions.permission({
			alias: permission || this.parent.auth.ctx.get('apptype'),
			active: true,
		})

		if (!perm)
			throw new Error(
				this.parent.locale.get(
					`${this.parent.permissions.table}_error_not_found`,
				),
			)

		Object.assign(data, {
			permission: perm.id,
		})

		return data
	}
	fullName(data) {
		const { fullName, firstName, lastName } = data

		if (!fullName && lastName)
			Object.assign(data, {
				fullName: (firstName || '').concat(' ', lastName),
			})

		return data
	}
	async where(where) {
		const { permission } = where

		if (permission && typeof permission === 'string') {
			const { id } =
				(await this.parent.permissions.permission({
					alias: permission,
				})) || {}

			Object.assign(where, {
				permission: id,
			})
		}

		return where
	}
	async instance(user = {}) {
		const apptype = this.parent.auth.ctx.get('apptype')

		const { rules } = user.permission || {}

		const rule = `${this.parent.table}-ignore-instance`

		await this.parent.permissions.validator.validateRole(rule)

		if (
			!Object.keys(rules || {}).find(r => r === rule) &&
			(!apptype || apptype !== user.role)
		)
			throw new Error(
				this.parent.locale.get(`${this.parent.table}_error_instance`),
			)

		return true
	}
}
