import Proto from '../../../lib/proto/resolver'
import Controller from './controller'
import { schema } from './schema'

const controller = new Controller()

export default class extends Proto {
	constructor() {
		super(schema)
	}
	async pushTemplate(_, { input }, { db, locale, auth }) {
		controller.use(db, locale, auth)

		await controller.user.can(`${controller.table}-show`)

		return controller.one(input, {
			l18n: locale.current
		})
	}
	async pushTemplates(_, { input }, { db, locale, auth }) {
		controller.use(db, locale, auth)

		await controller.user.can(`${controller.table}-show`)

		return controller.list(input, {
			l18n: locale.current
		})
	}
	async pushTemplate_i18n(_, { input }, { db, locale, auth }) {
		controller.use(db, locale, auth)

		await controller.user.can(`${controller.table}-show`)

		const item = await controller.one(input, {
			l18n: locale.enabled
		})

		return item
	}
	async pushTemplates_i18n(_, { input }, { db, locale, auth }) {
		controller.use(db, locale, auth)

		await controller.user.can(`${controller.table}-show`)

		const list = await controller.list(input, {
			l18n: locale.enabled
		})

		return list
	}
	async _addPushTemplate(_, { input }, { db, locale, auth }) {
		controller.use(db, locale, auth)

		await controller.user.can(`${controller.table}-add`)
		await controller.add(input)

		return true
	}
	async _editPushTemplate(_, { input, id }, { db, locale, auth }) {
		controller.use(db, locale, auth)

		await controller.user.can(`${controller.table}-edit`)
		await controller.edit({ id }, input)

		return true
	}
	async _removePushTemplate(_, { id }, { db, locale, auth }) {
		controller.use(db, locale, auth)

		await controller.user.can(`${controller.table}-remove`)
		await controller.remove({ id })

		return true
	}
}
