import Proto from '../../../lib/proto/resolver'
import Controller from './controller'
import { schema } from './schema'

const controller = new Controller()

export default class extends Proto {
	constructor() {
		super(schema)
	}
	async permission(_, { input }, { db, auth, locale }) {
		await controller.use(db, locale, auth).user.can(`${controller.table}-show`)

		return controller.permission(input)
	}
	async permissions(_, { input }, { db, auth, locale }) {
		const { role } = await controller.use(db, locale, auth).user.current()

		await controller.user.can(`${controller.table}-show`)

		return controller.permissions(input, row => {
			if (role === 'dev') return true
			if (role === 'su') return row.alias !== 'dev'
			if (role === 'admin') return row.alias !== 'dev' && row.alias !== 'su'

			return false
		})
	}
	async permissionsAvailable(_, args, { db, locale, auth }) {
		await controller
			.use(db, locale, auth)
			.user.can(`${controller.table}-show-config`)

		return Array.from(controller.rules)
	}
	async _addUserPermission(_, { input }, { db, locale, auth }) {
		await controller.use(db, locale, auth).user.can(`${controller.table}-add`)

		await controller.addPermision(input)

		return true
	}
	async _editUserPermission(_, { input, id }, { db, locale, auth }) {
		await controller.use(db, locale, auth).user.can(`${controller.table}-edit`)

		await controller.editPermision(input, id)

		return true
	}
	async _addUserPermissionRule(_, { input, where }, { db, locale, auth }) {
		await controller.use(db, locale, auth).user.can(`${controller.table}-edit`)

		const { key, value } = input

		await controller.editPermisionRule(where, key, value)

		return true
	}
	async _addUserPermissionRulesAll(_, { input }, { db, locale, auth }) {
		await controller
			.use(db, locale, auth)
			.user.can(`${controller.table}-delegate-all`)

		await controller.use(db, locale, auth).delegateAll(input)

		return true
	}
	async _removeUserPermission(_, { id }, { db, locale, auth }) {
		controller.use(db, locale, auth)

		await controller.user.can(`${controller.table}-remove`)
		await controller.remove({ id })

		return true
	}
}
