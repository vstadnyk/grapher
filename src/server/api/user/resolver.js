import Proto from '../../proto/resolver'
import Controller from './controller'
import { schema, scalars } from './schema'

const controller = new Controller()

export default class extends Proto {
	constructor() {
		super(schema, scalars)
	}
	async user(_, { input = {} }, { db, auth, locale }, info) {
		await controller.use(db, auth, locale).can(`${controller.table}-show`)

		const { permission, role, locations } = this.gFields(info) || {}

		if (!input) {
			const { id } = (await controller.current()) || {}

			if (id) Object.assign(input, { id })
		}

		return controller.use(db, auth, locale).user(input, {
			joinPermission: !!permission || !!role,
			joinLocations: !!locations,
		})
	}
	async users(_, { input }, { db, auth, locale }, info) {
		await controller.use(db, auth, locale).can(`${controller.table}-show`)

		const { permission, role, locations } = this.gFields(info).rows || {}

		return controller.users(input, {
			joinPermission: !!permission || !!role,
			joinLocations: !!locations,
		})
	}
	async _register(_, { input }, { db, auth, locale }, info) {
		const { role, permission, locationsType } = this.gFields(info)

		controller.use(db, auth, locale)

		const user = await controller.authorization.register(input, {
			joinPermission: !!permission || !!role,
			joinLocations: !!locationsType,
		})

		return user
	}
	async _login(_, { mail, pass }, { db, auth, locale }, info) {
		controller.use(db, auth, locale)

		const { permission, role, locationsType } = this.gFields(info).user || {}

		const login = await controller.authorization.login(mail, pass, {
			joinPermission: !!permission || !!role,
			joinLocations: !!locationsType,
		})

		return login
	}
	async _logout(_, args, { auth, locale }) {
		await controller.use(auth, locale).logout()

		return true
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

		const user = await controller.authorization.forgotPass(mail, {
			joinPermission: true,
		})

		if (user) {
			await controller.mailer.send({
				to: { mail: user.mail, name: user.fullName },
				alias: 'forgot_password',
				variables: { user },
			})
		}

		return true
	}
	async _editProfile(_, { input }, { db, auth, locale }, info) {
		controller.use(db, auth, locale)

		await controller.can(`${controller.table}-edit-profile`)

		const { id } = await controller.current()

		const { permission, role, locationsType } = this.gFields(info)

		const user = await controller.editUser({ id }, input, {
			joinPermission: !!permission || !!role,
			joinLocations: !!locationsType,
		})

		return user
	}
	async _addUser(_, { input }, { db, auth, locale }) {
		await controller.use(db, auth, locale).can(`${controller.table}-add`)

		await controller.addUser(input)

		return true
	}
	async _editUser(_, { input, id }, { db, auth, locale }) {
		await controller.use(db, auth, locale).can(`${controller.table}-edit`)

		await controller.editUser({ id }, input)

		return true
	}
	async _removeUser(_, { input: where }, { db, auth, locale }) {
		await controller.use(db, auth, locale).can(`${controller.table}-remove`)

		await controller.removeUsers(where)

		return true
	}
	async _editUserStatus(
		_,
		{ id, status, mailer },
		{ db, auth, locale, pushserver },
	) {
		controller.use(db, auth, locale, pushserver)

		await controller.can(`${controller.table}-edit`)
		await controller.can(`${controller.table}-edit-status`)
		await controller.changeStatus(id, status)

		const user = await controller.user(
			{ id },
			{
				joinPermission: true,
			},
		)

		if (pushserver) {
			this.__pusher
				.emit(status ? 'onUserEnable' : 'onUserDisable')
				.send({ user }, false, id)
		}

		if (mailer) {
			const { alias, variables, lang } = mailer

			await controller.mailer.send({
				to: { mail: user.mail, name: user.fullName },
				alias: alias || `${status ? 'enable' : 'disable'}_user`,
				variables: Object.asign(variables ? JSON.parse(variables) : {}, {
					user,
				}),
				lang: lang || locale.current,
			})
		}

		return true
	}
}
