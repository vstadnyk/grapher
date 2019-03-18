import path from 'path'

import Template from '../../../lib/template'
import Controller from '../../../lib/proto/controller'

export default class extends Controller {
	constructor(parent) {
		super()

		this.parent = parent
	}
	async data(
		data = {
			to: null,
			from: null,
			variables: {},
			lang: null,
			wrapper: null,
			template: null
		}
	) {
		const { to, from, variables, subject, lang, wrapper, template } = data

		const config = await this.parent.config()

		const {
			default: { from: fromDefault, subject: subjectDefault },
			template: { logo, wrapper: wrapperDefault, dir, defTmpl }
		} = this.__mapToObject(config)

		Object.assign(data, {
			to: this.sender(to),
			from: from
				? this.sender(from)
				: this.sender(fromDefault, this.parent.locale, lang),
			subject: subject || this.parent.locale.get(subjectDefault, lang),
			vars: Object.assign({}, variables || {}, {
				locale: {},
				logo: global.publicUrl.concat(logo),
				year: this.moment().format('Y'),
				date: this.moment().format('Y-MM-DD'),
				time: this.moment().format('HH:mm:ss')
			}),
			template: template || defTmpl,
			wrapper: wrapper || wrapperDefault,
			dir,
			lang: lang || this.parent.locale.current
		})
		;['regards', 'name', 'copyright', 'dir'].forEach(row => {
			Object.assign(data.vars.locale, {
				[row]: this.parent.locale.get(`mailer_template_${row}`, lang)
			})
		})

		delete data.variables

		return data
	}
	sender({ name = '', mail = null }, locale, lang = null) {
		return name ? `"${locale ? locale.get(name, lang) : name}" <${mail}>` : mail
	}
	async template(
		data = {
			subject: '',
			message: null,
			dir: null,
			wrapper: null,
			vars: {},
			template: null,
			alias: null,
			lang: null
		}
	) {
		const {
			subject,
			message: msg,
			dir,
			wrapper,
			vars,
			template,
			alias,
			lang
		} = data

		let output = ''

		if (alias) {
			const tmpl = await this.parent.mailTemplates.one(
				{
					alias,
					active: true
				},
				{
					l18n: [lang]
				}
			)

			if (!tmpl)
				throw this.parent.error('template_not_found', null, 200, `: ${alias}`)

			const { subject: tmplSubject, message } = tmpl

			Object.assign(data, { subject: tmplSubject || subject })

			output = await Template.renderStr(message || '', vars)
		} else {
			output = await Template.load(
				path.resolve([dir, lang, template].join('/')),
				msg ? Object.assign({}, vars, { message: msg }) : vars
			)
		}

		const html = await Template.load(
			path.resolve([dir, wrapper].join('/')),
			Object.assign({}, vars, { output })
		)

		Object.assign(data, { html })

		return data
	}
}
