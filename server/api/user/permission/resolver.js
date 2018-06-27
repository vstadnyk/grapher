import Proto from '../../../proto/resolver'
import Controller from './controller'
import { schema } from './schema'

const controller = new Controller()

export default class extends Proto {
	constructor() {
		super()

		this.schema = schema
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
		await controller.use(db, locale, auth).user.can(`${controller.table}-show-config`)

		return controller.available
	}
	async _addUserPermission(_, { input }, { db, locale, auth }) {
		await controller.use(db, locale, auth)
		// .user.can(`${controller.table}-add`)

		await controller.addPermision(input)

		return true
	}
	async _addUserPermissionRole(_, { input, where }, { db, locale, auth }) {
		await controller.use(db, locale, auth).user.can(`${controller.table}-edit`)

		const { key, value } = input
		
		await controller.editPermisionRole(where, key, value)

		return true
	}
	async _addUserPermissionRolesAll(_, { input }, { db, locale, auth }) {
		await controller.use(db, locale, auth)
		// .user.can(`${controller.table}-delegate-all`)

		await controller.use(db, locale, auth).delegateAll(input)

		return true
	}
}
