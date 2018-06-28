import PassGenerator from 'password-generator'

import Controller from '../../proto/controller'

export default class extends Controller {
	constructor(parent) {
		super()

		this.parent = parent
	}
	async register(data = {}, options = false) {
		const rUser = await this.parent.auth.addUser(data)

		if (!rUser)
			throw new Error(
				this.parent.locale.get(`${this.parent.table}_error_register`)
			)

		Object.assign(data, {
			rid: rUser.id
		})

		const user = await this.parent.add(data)

		if (!user)
			throw new Error(
				this.parent.locale.get(`${this.parent.table}_error_register`)
			)

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
		const rUser = await this.parent.auth.user

		if (!rUser)
			throw new Error(
				this.parent.locale.get(`${this.parent.table}_error_login`)
			)

		const user = await this.parent.user(
			{
				rid: rUser.id,
				active: true
			},
			Object.assign({}, options, {
				joinPermission: true
			})
		)

		if (!user)
			throw new Error(
				this.parent.locale.get(`${this.parent.table}_error_login`)
			)

		await this.parent.validator.instance(user)

		await this.parent.edit(
			{
				id: user.id
			},
			{
				loginAt: new Date()
			}
		)

		return {
			user,
			tokens: rUser.tokens
		}
	}
	async refreshToken(refreshToken) {
		const tokens = await this.parent.auth.refreshToken(refreshToken)

		if (!tokens || !tokens.refreshToken || !tokens.accessToken)
			throw new Error(
				this.parent.locale.get(
					`${this.parent.parent.table}_error_refresh_tokens`
				)
			)

		return tokens
	}
	async forgotPass(mail, options) {
		const password = PassGenerator(8, false)
		const rUser = await this.parent.auth.getUser({
			mail
		})

		if (!rUser || !rUser.length)
			throw new Error(
				this.parent.locale.get(
					`${this.parent.parent.table}_error_mail_not_found`
				)
			)

		const user = await this.parent.user(
			{
				rid: rUser.shift().id,
				active: true
			},
			options
		)

		if (!user)
			throw new Error(
				this.parent.locale.get(
					`${this.parent.table}_error_user_not_found`
				)
			)

		await this.parent.auth.changePass(user.rid, password)

		return user
	}
}
