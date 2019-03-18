import Nodemailer from 'nodemailer'

import User from '../../user/controller'
import Config from '../config/controller'
import MailTemplates from './template/controller'
import Controller from '../../../lib/proto/controller'

import Builder from './builder'
import Validator from './validator'

import { config } from './schema'

export default class extends Controller {
	get table() {
		return 'mailer'
	}
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
			const transport = await Nodemailer.createTransport(smtp)

			return transport
		} catch (error) {
			throw error
		}
	}
	async config(key = null) {
		this._config = await this.configDB.getOne('mailer')

		if (!this._config) {
			this._config = await this.configDB.insert(
				'mailer',
				config,
				'_',
				'Main mail config',
				'Main mail config'
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
			await this._sendAsync(connect, data)
		} catch (error) {
			throw this.error('send_mail ', null, 200, error.message)
		}

		return true
	}
	async _sendAsync(connect, data) {
		return new Promise((resolve, reject) => {
			connect.sendMail(data, error => {
				if (error) reject(error)

				resolve(true)
			})
		})
	}
}
