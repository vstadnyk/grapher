require('babel-core/register')
require('babel-polyfill')

const { default: DB } = require('./server/db')
const { default: Locale } = require('./server/locale')
const { default: Auth } = require('./server/auth/index')
const { default: User } = require('./server/api/user/controller')
const {
	default: Permissions
} = require('./server/api/user/permission/controller')

const key = require('./setup.json')
const availableRules = require('./server-data/permissions.json')

;

(async () => {
	if (!key) throw new Error('Key not found')

	const db = new DB()
	const perm = new Permissions()
	const user = new User()
	const auth = new Auth()
	const locale = new Locale()

	const {
		alias,
		name,
		rules,
		developer: { mail, pass }
	} = key

	try {
		await auth.start()
		await db.start()
		await locale.init()

		for (const iterator of [user, perm]) {
			iterator.use(db, auth, locale)

			await db.model(iterator.table, iterator.fields).sync({
				force: false
			})
		}

		if (!(await perm.model.count({ where: { alias } }))) {
			if (availableRules) {
				for (const rule of availableRules) {
					Object.assign(rules, { [rule]: true })
				}
			}

			await perm.add({
				name,
				alias,
				rules
			})
		}

		await user.removeUsers(
			{
				mail
			},
			false
		)

		await user.addUser({
			mail,
			pass,
			permission: alias
		})

		await db.orm.connectionManager.close()
		await auth.close()
	} catch (error) {
		throw new Error(`Ooops, we have error :(`)
	}
})()
