import Proto from '../../lib/proto/resolver'
import Controller from './controller'
import { schema } from './schema'

import Pusher from '../push/controller'

const controller = new Controller()

export default class extends Proto {
	constructor() {
		super(schema)
	}
	async user(_, { input = {} }, { db, auth, locale }, info) {
		controller.use(db, auth, locale)

		await controller.can(`${controller.table}-show`)

		if (!Object.values(input).length) {
			const { id } = (await controller.current()) || {}

			if (id) Object.assign(input, { id })
		}

		return controller.user(input, this.gFields(info) || {})
	}
	async users(_, { input }, { db, auth, locale }, info) {
		controller.use(db, auth, locale)

		await controller.can(`${controller.table}-show`)

		return controller.users(input, this.gFields(info).rows || {})
	}
	async ping(_, args, { auth }) {
		await auth.ping()

		return !!auth.user
	}
	_register(_, { input }, { db, auth, locale }) {
		return controller.use(db, auth, locale).addUser(input, { permission: {} })
	}
	_login(_, { mail, pass }, { ctx, api, db, auth, locale }, info) {
		controller.ctx = ctx

		return controller
			.use(api, db, auth, locale)
			.authorization.login(mail, pass, this.gFields(info).user || {})
	}
	_logout(_, args, { auth, locale }) {
		return controller.use(auth, locale).logout()
	}
	_refreshToken(_, { refreshToken }, { auth, locale }) {
		return controller.use(auth, locale).authorization.refreshToken(refreshToken)
	}
	async _changePass(_, { pass, currentPass, id }, { db, auth, locale }) {
		controller.use(db, auth, locale)

		await controller.can(`${controller.table}-change-password`)

		await controller.changePass({ id, pass, currentPass })

		return true
	}
	async _forgotPass(_, { mail }, { db, auth, locale }) {
		controller.use(db, auth, locale)

		const { user, password } = await controller.authorization.forgotPass(mail, {
			permission: {}
		})

		if (user) {
			await controller.mailer.send({
				to: { mail: user.mail, name: user.fullName },
				alias: 'forgot_password',
				variables: { user, pass: password, password }
			})
		}

		return true
	}
	async _editProfile(_, { input }, { db, auth, locale }, info) {
		controller.use(db, auth, locale)

		await controller.can(`${controller.table}-edit-profile`)

		const { id } = await controller.current()

		const user = await controller.editUser({ id }, input, this.gFields(info))

		return user
	}
	async _addUser(_, { input }, { db, auth, locale }) {
		controller.use(db, auth, locale)

		await controller.can(`${controller.table}-add`)

		await controller.addUser(input)

		return true
	}
	async _editUser(_, { input, id }, { db, auth, locale }) {
		controller.use(db, auth, locale)

		await controller.can(`${controller.table}-edit`)

		await controller.editUser({ id }, input)

		return true
	}
	async _removeUser(_, { input: where }, { db, auth, locale }) {
		controller.use(db, auth, locale)

		await controller.can(`${controller.table}-remove`)

		await controller.removeUsers(where)

		return true
	}
	async _editUserStatus(_, { id, status, mailer = {} }, { db, auth, locale }) {
		controller.use(db, auth, locale)

		await controller.can(`${controller.table}-edit`)
		await controller.can(`${controller.table}-edit-status`)

		const user = await controller.edit(
			{ id },
			{ active: status },
			{ permission: {} }
		)

		await new Pusher()
			.use(db, locale, auth)
			.emit(status ? 'onUserEnable' : 'onUserDisable')
			.send({ vars: { user }, users: [id] })

		const {
			alias = null,
			subject = null,
			message = null,
			variables = {},
			lang
		} = mailer

		if (!subject && !message) {
			Object.assign(mailer, {
				alias: alias || `${status ? 'enable' : 'disable'}_user`
			})
		}

		await controller.mailer.send(
			Object.assign({}, mailer, {
				to: { mail: user.mail, name: user.fullName },
				variables: Object.assign({ reason: null }, variables, {
					user
				}),
				lang: lang || locale.current
			})
		)

		return true
	}
}
