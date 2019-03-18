import Proto from '../../lib/proto/validator'

export default class extends Proto {
	async data(data, ignore = [], user) {
		await Promise.all(
			Object.entries(this.parent.fields)
				.filter(([key]) => this.has(key) && !ignore.find(row => row === key))
				.map(([key, field]) => this[key](data, field, user))
		)

		return data
	}
	async locations(data, field, user) {
		const { locationInput } = data

		if (locationInput) {
			const { id } = await this.parent.location.modifyLocation(locationInput, {
				addToUser: user ? { id: user.id } : false
			})

			if (!user) Object.assign(data, { locations: [id], defaultLocation: id })
			if (user && !user.defaultLocation)
				Object.assign(data, { defaultLocation: id })
		}

		return data
	}
	async mail(data, field) {
		if (field.allowNull !== false) return data

		const { mail } = data

		if (
			await this.parent.exist({
				mail
			})
		)
			throw this.parent.error('email_exists')

		return data
	}
	async permission(data, field, user = false) {
		if (
			field.allowNull !== false ||
			(user && user.permission && !data.permission)
		)
			return data

		const { permission: alias } = data

		const { id: permission } =
			(await this.parent.permissions.one({
				alias: alias || this.parent.auth.ctx.get('apptype'),
				active: true
			})) || {}

		if (!permission) throw this.parent.permissions.error('permission_not_found')

		Object.assign(data, { permission })

		return data
	}
	fullName(data) {
		const { fullName, firstName, lastName } = data

		if (!fullName && lastName)
			Object.assign(data, {
				fullName: (firstName || '').concat(' ', lastName)
			})

		return data
	}
	async where(where) {
		const { permission } = where

		if (permission && typeof permission === 'string') {
			const { id } =
				(await this.parent.permissions.permission({
					alias: permission
				})) || {}

			Object.assign(where, {
				permission: id
			})
		}

		return where
	}
	async instance(user = {}, apptype = null) {
		const { instance: config } = this.parent.config

		Object.keys(config).forEach(key => {
			const headerKey = (
				this.parent.ctx ||
				(this.parent.api || {}).ctx ||
				(this.parent.auth || {}).ctx
			).get(key)

			if (!headerKey) throw this.parent.error(`${key}_not_found`)
			if (!config[key].find(v => v === headerKey))
				throw this.parent.error(`${key}_not_valid`)
		})

		const { rules } = user.permission || {}

		const rule = `${this.parent.table}-ignore-instance`

		await this.parent.permissions.validator.validateRule(rule)

		if (rules[rule]) return true

		if (apptype !== user.role) {
			throw this.parent.error(
				'instance',
				null,
				null,
				` user: ${user.id}, role: ${user.role}, apptype: ${apptype}`
			)
		}

		return true
	}
}
