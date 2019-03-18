import PassGenerator from 'password-generator'

import Controller from '../../lib/proto/controller'

export default class extends Controller {
	constructor(parent) {
		super()

		this.parent = parent
	}
	async register(data = {}, options = false) {
		const { id: rid } = (await this.parent.auth.addUser(data)) || {}

		if (!rid) throw this.parent.error('register')

		Object.assign(data, { rid })

		const user = await this.parent.add(data, options)

		if (!user) throw this.parent.error('register')

		if (!options) return true

		const _user = await this.parent.user({ id: user.id }, options)

		return _user
	}
	async login(mail, pass, options = {}) {
		await this.parent.auth.login({
			username: mail,
			password: pass
		})

		return this.loginOutput(options)
	}
	async logout() {
		await this.parent.auth.logout()

		return !this.parent.auth.user
	}
	async loginOutput(options = {}) {
		const { id: rid, tokens } = await this.parent.auth.user

		if (!rid) throw this.parent.error('login')

		const user = await this.parent.user(
			{ rid },
			Object.assign({}, options, { joinPermission: true })
		)

		if (!user) throw this.parent.error('login')
		if (user.active === false) throw this.parent.error('account_disable')

		await this.parent.validator.instance(user, this.parent.ctx.get('apptype'))

		await this.parent.edit({ id: user.id }, { loginAt: new Date() })

		return { user, tokens }
	}
	refreshToken(refreshToken) {
		return this.parent.auth.refreshToken(refreshToken)
	}
	async forgotPass(mail, options) {
		const password = PassGenerator(8, false)
		const { id: rid } =
			(await this.parent.auth.getUser({
				mail
			})) || {}

		if (!rid) throw this.parent.error('mail_not_found')

		const user = await this.parent.user({ rid, active: true }, options)

		if (!user) throw this.parent.error('not_found')

		await this.parent.auth.changePass(rid, password)

		return { password, user }
	}
}
