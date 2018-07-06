import path from 'path'

import Template from '../../../../lib/template'
import Controller from '../../../proto/controller'

export default class extends Controller {
	constructor(parent) {
		super()

		this.parent = parent
	}
	async data(data) {
		const { to, from, variables, subject, lang, wrapper, template } = data

		const config = await this.parent.config()

		const {
			main: { from: fromDefault, subject: subjectDefault },
			template: { logo, wrapper: wrapperDefault, dir, defTmpl },
		} = this.__mapToObject(config)

		Object.assign(data, {
			to: this.sender(to),
			from: from
				? this.sender(from)
				: this.sender(fromDefault, this.parent.locale, lang),
			subject: subject || this.parent.locale.get(subjectDefault, lang),
			vars: Object.assign({}, variables || {}, {
				locale: {},
				logo: this.parent.publicUrl(logo),
				year: this.moment().format('Y'),
				date: this.moment().format('Y-MM-DD'),
				time: this.moment().format('HH:mm:ss'),
			}),
			template: template || defTmpl,
			wrapper: wrapper || wrapperDefault,
			dir,
			lang: lang || this.parent.locale.current,
		})
		;['regards', 'name', 'copyright', 'dir'].forEach(row => {
			Object.assign(data.vars.locale, {
				[row]: this.parent.locale.get(`mailer_template_${row}`, lang),
			})
		})

		delete data.variables

		return data
	}
	sender(data, locale, lang) {
		const { name, mail } = data

		return name ? `"${locale ? locale.get(name, lang) : name}" <${mail}>` : mail
	}
	async template(data) {
		const { subject, dir, wrapper, vars, template, alias, lang } = data

		let output = ''

		if (alias) {
			const tmpl = await this.parent.mailTemplates.item(
				{
					alias,
					active: true,
				},
				false,
				false,
				lang,
			)

			if (!tmpl) throw new Error(`Mail template "${alias}" not found`)

			const { subject: tmplSubject, message } = tmpl

			Object.assign(data, { subject: tmplSubject || subject })

			output = await Template.renderStr(message || '', vars)
		} else {
			output = await Template.get(
				path.resolve([dir, lang, template].join('/')),
				vars,
			)
		}

		const html = await Template.get(
			path.resolve([dir, wrapper].join('/')),
			Object.assign({}, vars, { output }),
		)

		Object.assign(data, { html })

		return data
	}
}
