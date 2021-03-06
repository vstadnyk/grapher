import Crypto from 'crypto'

export default class User {
	constructor(thinky) {
		if (!this.orm) {
			this.orm = thinky
			this.rdb = this.orm.r
		}
	}
	get table() {
		return 'User'
	}
	get crypto() {
		return Crypto
	}
	get schema() {
		if (!this.orm) return null

		const { type } = this.orm

		return {
			id: type.string(),
			mail: type.string().email(),
			pass: type.buffer(),
			salt: type.string()
		}
	}
	get model() {
		return (
			this.orm.models[this.table] ||
			this.orm.createModel(this.table, this.schema)
		)
	}
	async add(user = {}) {
		const Model = this.model
		const salt = Crypto.randomBytes(128).toString('base64')
		const pass = user.pass ? this.cryptoPass(user.pass, salt) : null

		return new Model(Object.assign({}, user, { salt, pass })).save()
	}
	async login({ mail, pass }) {
		const list = await this.model.filter(u => u('mail').eq(mail)).run()

		return list.find(u => this.equalsPass(pass, u.salt, u.pass)) || false
	}
	cryptoPass(pass, salt) {
		return Crypto.pbkdf2Sync(pass, salt, 1, 128, 'sha1')
	}
	equalsPass(pass, salt, hash) {
		return this.cryptoPass(pass, salt).equals(hash)
	}
	updateLoginDate(id, date = false) {
		return this.edit(id, {
			loginAt: date || new Date()
		})
	}
	async changePass(id, pass, currentPass = false) {
		const user = await this.one({ id })

		if (!user)
			throw Object.assign(new Error(), {
				type: 'AUTH_NOT_FOUND',
				message: 'Auth - Change Password error: User not found'
			})

		if (currentPass && !this.equalsPass(currentPass, user.salt, user.pass))
			throw Object.assign(new Error(), {
				type: 'AUTH_NOT_EQUAL_PASS',
				message:
					'Auth - Change Password error: Provided password is not correct'
			})

		await this.edit(id, { pass: this.cryptoPass(pass, user.salt) })

		return true
	}
	async list(where = {}) {
		// old get()
		return this.model.filter(where).run()
	}
	async one(where = {}) {
		try {
			const user = await this.model
				.filter(where)
				.nth(0)
				.default(null)
				.run()

			return user
		} catch (error) {
			return null
		}
	}
	async edit(id, data = {}) {
		return this.model
			.get(id)
			.update(data)
			.run()
	}
}
