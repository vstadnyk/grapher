import schema from './schema'
import Controller from './controller'

import Proto from '../../../lib/proto/resolver'

const controller = new Controller()

export default class extends Proto {
	constructor() {
		super(schema)
	}
	async serverInfo(_, args, { db, api, auth, locale }, info) {
		controller.use(db, api, auth, locale)

		await controller.user.can(`server-show-info`)

		const { sslValidFrom, sslValidTo, dataBase } = this.gFields(info) || {}

		return controller.info({
			dbInfo: !!dataBase,
			sslInfo: !!sslValidFrom || !!sslValidTo
		})
	}
	async serverLog(_, { type = 'errors', input }, { loger, db, auth, locale }) {
		await controller.use(db, auth, locale, loger).user.can(`server-show-log`)

		return controller.log(type, input)
	}
	async tokenInfo(_, { token = '' }, { db, auth, locale }) {
		await controller.use(db, auth, locale).user.can(`server-test-token`)

		const { iat, exp, id: rid = null, mail = null } =
			auth.tokenInfo(token) || {}

		if (!iat) return null

		const fn = date =>
			controller.moment(new Date(date * 1000)).format('YYYY-MM-DD HH:mm:ss')

		return {
			type: rid ? 'accessToken' : 'refreshToken',
			rid,
			mail,
			generated: fn(iat),
			die: fn(exp)
		}
	}
	async _editSSL(ctx, input, { api, loger, db, auth, locale }) {
		await controller
			.use(api, db, auth, locale, loger)
			.user.can(`server-edit-ssl`)

		await controller.editSSL(input)

		return true
	}
	async _clearServerLog(ctx, { type = 'errors' }, { loger, db, auth, locale }) {
		await controller.use(db, auth, locale).user.can(`server-clear-log`)

		await loger.clear(loger.config[type].file)

		return true
	}
	async _restartServer(_, { pm }, { db, api, auth, locale }) {
		await controller.use(db, api, auth, locale).user.can(`server-restart`)

		await controller.restart(pm)

		return true
	}
	async _stopServer(_, { pm }, { db, api, auth, locale }) {
		await controller.use(db, api, auth, locale).user.can(`server-stop`)

		await controller.stop(pm)

		return true
	}
}
