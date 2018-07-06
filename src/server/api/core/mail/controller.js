import Mailer from 'nodemailer'

import User from '../../user/controller'
import Config from '../config/controller'
import MailTemplates from './template/controller'
import Controller from '../../../proto/controller'

import Builder from './builder'
import Validator from './validator'

import { config } from './schema'

export default class extends Controller {
	get user() {
		return new User().use(this.db, this.auth, this.locale)
	}
	get configDB() {
		return new Config().use(this.db, this.auth, this.locale)
	}
	get builder() {
		return new Builder(this)
	}
	get validator() {
		return new Validator(this)
	}
	get mailTemplates() {
		return new MailTemplates().use(this.db, this.auth, this.locale)
	}
	async connect() {
		const smtp = await this.config('smtp')

		try {
			const transport = await Mailer.createTransport(smtp)

			return transport
		} catch (error) {
			throw new Error(`Mailer connection error: "${JSON.stringify(error)}"`)
		}
	}
	async config(key = false) {
		this._config = await this.configDB.get('mailer')

		if (!this._config) {
			this._config = await this.configDB.set(
				'mailer',
				config,
				'_',
				'Main mail config',
				'Main mail config',
			)
		}

		return key ? this._config.get(key) : this._config
	}
	async send(data = {}) {
		await this.builder.data(data)
		await this.builder.template(data)
		await this.validator.data(data)

		const connect = await this.connect()

		try {
			connect.sendMail(data, error => {
				if (error)
					throw new Error(`Mailer send error: "${JSON.stringify(error)}"`)
			})
		} catch (error) {
			throw new Error(`Mailer send error: "${JSON.stringify(error)}"`)
		}

		return true
	}
}
