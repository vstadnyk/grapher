import fs from 'fs'
import glob from 'glob'
import path from 'path'
import { promisify } from 'util'

import DB from './lib/db'
import Locale from './server/locale'
import Auth from './lib/auth/index'
import User from './api/user/controller'
import Permissions from './api/user/permission/controller'

import setupConfig from './setup.config'
import { staticPath } from './config'

const { staticDir = [], suPermission, su } = setupConfig || {}

const buildStaticTree = async () => {
	const staticPathRelative = './'.concat(staticPath)

	if (!fs.existsSync(staticPathRelative))
		await promisify(fs.mkdir)(staticPathRelative)

	// create folders
	await Promise.all(
		staticDir
			.reduce(
				(a, dir) =>
					a.concat(
						staticPathRelative.concat('/', dir.dirname || dir),
						(dir.folders || []).map(({ dirname }) =>
							staticPathRelative.concat('/', dir.dirname || dir, '/', dirname)
						)
					),
				[]
			)
			.map(dir => (!fs.existsSync(dir) ? promisify(fs.mkdir)(dir) : null))
	)

	// create files
	await Promise.all(
		staticDir
			.filter(row => typeof row === 'object')
			.reduce(
				(a, { dirname = '', folders = [], files = [] }) =>
					a.concat(
						files.map(file =>
							staticPathRelative.concat('/', dirname, '/', file)
						),
						...(folders || []).map(
							({ dirname: sub = '', files: subFiles = [] } = {}) =>
								subFiles.map(file =>
									staticPathRelative.concat('/', dirname, '/', sub, '/', file)
								)
						)
					),
				[]
			)
			.map(file =>
				!fs.existsSync(file) ? promisify(fs.writeFile)(file, '') : null
			)
	)

	return true
}

// buildStaticTree()

const getTables = async () => {
	const list = (await promisify(glob)('./**/controller.mjs')) || []

	const controllers = await Promise.all(
		list.map(file => path.resolve(file)).map(file => import(file))
	)

	return [
		...new Set(
			controllers
				.map(({ default: Controller }) => {
					const { table, fields } = new Controller()

					return { table, fields }
				})
				.filter(row => row)
		)
	]
}

const run = async () => {
	await buildStaticTree()

	const db = new DB()
	const auth = new Auth()
	const locale = new Locale()

	const user = new User().use(db, auth, locale)
	const permission = new Permissions().use(db, auth, locale)

	const { alias } = suPermission

	try {
		await db.start()
		await auth.start()
		await locale.initialize()

		const tables = await getTables()

		await Promise.all(
			tables
				.filter(({ fields }) => fields)
				.map(({ table, fields }) =>
					db.model(table, fields).sync({ force: false })
				)
		)

		if (!(await permission.exist({ alias }))) await permission.add(suPermission)

		await permission.delegateAll({ alias })

		await user.removeUsers({ mail: su.mail }, true)

		await user.addUser(Object.assign({}, su, { permission: alias }))

		await db.orm.connectionManager.close()

		await auth.close()
	} catch (error) {
		console.log(error)
	}
}

run()
