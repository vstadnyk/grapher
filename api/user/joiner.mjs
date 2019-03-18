import Proto from '../../lib/proto/joiner'

export default class extends Proto {
	async join(item, options = {}) {
		Object.assign(options, { permission: {} })

		await Promise.all(
			Object.entries(options)
				.filter(([key]) => this.has(key))
				.map(([key, value]) => this[key](item, value))
		)

		return item
	}
	async permission(user) {
		const permission = await this.parent.permissions.permission({
			id: user.permission,
			active: true
		})

		if (!permission) return user

		Object.assign(user, {
			permission,
			role: permission.alias
		})

		return user
	}
	async locationsFull(user, options) {
		const { rows: locationsFull } =
			(await this.parent.location.locations(
				{
					id: user.locations
				},
				options
			)) || {}

		Object.assign(user, { locationsFull })

		return user
	}
	async defaultLocationFull(user, options) {
		const defaultLocationFull = await this.parent.location.location(
			{
				id: user.defaultLocation
			},
			options
		)

		Object.assign(user, { defaultLocationFull })

		return user
	}
}
