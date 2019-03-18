import Proto from '../../lib/proto/validator'

export default class extends Proto {
	platform(data) {
		const { appplatform } = this.parent.config

		if (!data.platform) data.platform = this.parent.ctx.get('appplatform')

		const { platform } = data

		if (!platform) throw this.parent.error('platform_required')
		if (!appplatform.find(p => p === platform))
			throw this.parent.error('platform_not_valid')

		return data
	}
	app(data) {
		const { apptype } = this.parent.config

		if (!data.app) data.app = this.parent.ctx.get('apptype')

		const { app } = data

		if (!app) throw this.parent.error('app_required')
		if (!apptype.find(p => p === app)) throw this.parent.error('app_not_valid')

		return data
	}
	lang(data) {
		if (!data.lang)
			Object.assign(data, { lang: this.parent.ctx.get('applang') })
	}
	async user(data) {
		if (data.user) return data

		const { id: user } = await this.parent.user.current()

		Object.assign(data, { user })

		return data
	}
	async where(where = {}) {
		return where
	}
}
