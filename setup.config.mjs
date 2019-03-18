import { locales } from './config'

export default {
	su: {
		fullName: 'Developer',
		mail: 'dev@example.com',
		pass: '123456'
	},
	suPermission: {
		name: 'Developer',
		alias: 'dev',
		rules: {
			'users-ignore-instance': true,
			'user-permissions-delegate-all': true
		}
	},
	staticDir: [
		'log',
		'schema',
		'uploads',
		{
			dirname: 'storage',
			files: ['user-permissions.json']
		},
		{
			dirname: 'mail-templates',
			files: ['default.html'],
			folders: locales.active.map(dirname => ({
				dirname,
				files: ['message.html']
			}))
		},
		{
			dirname: 'ssl',
			files: ['default.cert', 'default.key']
		}
	]
}
