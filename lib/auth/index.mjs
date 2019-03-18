import Thinky from 'thinky'
import JWT from 'jsonwebtoken'
import Passport from 'koa-passport'
import StrategyLocal from 'passport-local'
import PassportJwt from 'passport-jwt'

import User from './user'
import { rdb as rdbConfig, jwt as jwtConfig } from '../../config'

const { tokens, headerKey } = jwtConfig
const { Strategy: JwtStrategy, ExtractJwt } = PassportJwt

export default class Auth {
	constructor() {
		this.passport = Passport
	}
	async start() {
		if (!this.User) await (this.User = new User(new Thinky(rdbConfig.connect)))

		return true
	}
	async close() {
		if (this.User) {
			this.User.rdb.getPoolMaster().drain()
		}

		return true
	}
	get user() {
		const { access, refresh } = tokens

		if (!this.ctx || !this.ctx.req || !this.ctx.req.user) return false

		let { user } = this.ctx.req

		if (Array.isArray(user)) {
			if (user.length !== 1) return false

			user = user.find(row => row)
		}

		delete user.pass

		const { id, mail } = user

		return Object.assign({}, user, {
			tokens: {
				accessToken: this.generateToken({ id }, access),
				refreshToken: this.generateToken({ mail }, refresh),
				tokenExpires: access.exp,
				refreshTokenExpires: refresh.exp
			}
		})
	}
	set user(user = false) {
		this.ctx.req.user = user

		return user
	}
	async remove(where = {}) {
		const { connect } = rdbConfig
		const { model } = new User(new Thinky(connect))

		await model.filter(where).run()

		try {
			await model.delete()
		} catch (error) {
			console.log(`Error remove user, "${JSON.stringify(where)}"`)
		}

		return true
	}
	async resetTable(table) {
		const { connect } = rdbConfig
		const user = new User(new Thinky(connect))

		const tables = await user.rdb.tableList().run()

		if (tables.indexOf(table) !== -1) {
			await user.rdb.tableDrop(table).run()
		}

		await user.rdb.tableCreate(table).run()

		return true
	}
	generateToken(data = {}, config) {
		const { secret, exp } = config

		return JWT.sign(data, secret, {
			expiresIn: exp
		})
	}
	async refreshToken(refreshToken) {
		let _user = null

		const { access, refresh } = tokens

		try {
			_user = JWT.decode(refreshToken)
		} catch (error) {
			throw new Error(`Auth error: Unable decode refreshToken "${error}"`)
		}

		if (!_user || !_user.mail)
			throw new Error(
				`Auth error: Unable parse refreshToken data "${JSON.stringify(_user)}"`
			)

		const user = await this.User.one({
			mail: _user.mail
		})

		if (!user)
			throw new Error(`Auth error: User with mail "${_user.mail}" not found`)

		try {
			JWT.verify(refreshToken, refresh.secret)
		} catch (error) {
			throw new Error(`Auth error: Unable verify refreshToken "${error}"`)
		}

		/* this.ctx.set(
			'RefreshSecret',
			this.User.crypto.createHmac('sha256', refresh.secret).digest('hex'),
		) */

		return Object.assign({}, user, {
			accessToken: this.generateToken({ id: user.id }, access),
			refreshToken: this.generateToken({ mail: user.mail }, refresh),
			tokenExpires: access.exp,
			refreshTokenExpires: refresh.exp
		})
	}
	prePassport() {
		const { connect } = rdbConfig

		return async (ctx, next) => {
			if (!this.User) {
				await (this.User = new User(new Thinky(connect)))
				await this.initialize()
			}

			await next()
		}
	}
	afterPassport() {
		return async (ctx, next) => {
			await (this.ctx = ctx)

			/* const validate = await this.validateToken()

			if (ctx.get(headerKey) && !validate) {
				if (ctx.get('apptype') && ctx.get('apptype') === 'mobile') {
					ctx.status = deadTokenHeaderStatus
				}
			} */

			await next()
		}
	}
	get token() {
		if (!this.ctx || !this.ctx.get(headerKey)) return null

		return JWT.decode(this.ctx.get(headerKey))
	}
	tokenInfo(token) {
		return JWT.decode(token)
	}
	validateToken() {
		if (!this.token) return false

		return !(new Date(this.token.exp * 1000) < new Date())
	}
	async ping() {
		this.ctx.req.user = false

		/* return this.passport.authenticate('jwt', async (error, user) => {
			if (error) throw new Error(error)

			this.ctx.login(user)

			return true
		})(this.ctx) */

		return new Promise((resolve, reject) => {
			this.passport.authenticate('jwt', (error, user) => {
				if (error) reject(error)

				this.ctx.login(user)

				resolve(this.user)
			})(this.ctx)
		})
	}
	login(args = false) {
		if (args) {
			this.ctx.request.body = args
		}

		return this.passport.authenticate(
			'local',
			{ session: false },
			async (error, user, info, status) => {
				if (!user) return false

				this.ctx.login(user, info, status)

				await this.User.updateLoginDate(user.id)

				return true
			}
		)(this.ctx)
	}
	logout() {
		if (this.user) this.user = null
		this.User = null
	}
	addUser(data) {
		return this.User.add(data)
	}
	getUser(where) {
		return this.User.one(typeof where === 'string' ? { id: where } : where)
	}
	changePass(id, pass, currentPass) {
		return this.User.changePass(id, pass, currentPass)
	}
	initialize() {
		const { access } = tokens

		this.passport.serializeUser((user, done) => {
			if (user && user.id) done(null, user.id)
		})

		this.passport.deserializeUser(async (id, done) => {
			const user = await this.User.one({ id })

			if (!user || !user.id) {
				done(`JWT deserialize error: User with ID "${id}" not found`)
			} else {
				done(null, user)
			}
		})
		this.passport
			.use(
				new StrategyLocal(async (mail, pass, done) => {
					try {
						const user = await this.User.login({
							mail,
							pass
						})

						done(null, user)
					} catch (error) {
						done(error)
					}
				})
			)
			.use(
				new JwtStrategy(
					{
						secretOrKey: access.secret,
						jwtFromRequest: ExtractJwt.fromExtractors([
							ctx => ctx.get(headerKey)
						])
					},
					({ id }, done) => this.passport.deserializeUser(id, done)
				)
			)
	}
}
