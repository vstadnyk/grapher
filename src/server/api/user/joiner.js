import Controller from '../../proto/controller'

export default class extends Controller {
	constructor(parent) {
		super()

		this.parent = parent
	}
	async join(user, options = {}) {
		for (const [option, value] of Object.entries(options)) {
			if (value && this.has(option)) {
				await this[option](user)
			}
		}

		return user
	}
	async joinPermission(user) {
		const permission = await this.parent.permissions.permission(
			{
				id: user.permission,
				active: true,
			},
			false,
		)

		if (!permission) return user

		Object.assign(user, {
			permission,
			role: permission.alias,
		})

		return user
	}
	async joinLocations(user) {
		const { rows: locations } =
			(await this.parent.location.locations({
				id: user.location,
			})) || {}

		Object.assign(user, { locations })

		return user
	}
}
