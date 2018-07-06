require('babel-core/register')
require('babel-polyfill')

const { default: DB } = require('./src/lib/db')
const { default: Locale } = require('./src/lib/locale')
const { default: Auth } = require('./src/server/auth/index')
const { default: User } = require('./src/server/api/user/controller')
const {
	default: Permissions,
} = require('./src/server/api/user/permission/controller')

const key = require('./setup.json')
const availableRules = require('./static/server-data/permissions.json')

const run = async () => {
	if (!key) throw new Error('Key not found')

	const db = new DB()
	const user = new User()
	const auth = new Auth()
	const locale = new Locale()
	const perm = new Permissions()

	const {
		alias,
		name,
		rules,
		developer: { mail, pass },
	} = key

	try {
		await auth.start()
		await db.start()
		await locale.init()

		for (const it of [user, perm]) {
			it.use(db, auth, locale)

			await db.model(it.table, it.fields).sync({
				force: false,
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
				rules,
			})
		}

		await user.removeUsers(
			{
				mail,
			},
			false,
		)

		await user.addUser({
			mail,
			pass,
			permission: alias,
		})

		await db.orm.connectionManager.close()
		await auth.close()
	} catch (error) {
		throw new Error(`Ooops, we have error :(`)
	}
}

run()
