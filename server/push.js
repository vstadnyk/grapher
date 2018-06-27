import * as admin from 'firebase-admin'

import { pushServer as config } from './config'

export default class PushServer {
	get authKey() {
		const { authKey } = this.config

		return authKey
	}
	get config() {
		return config
	}
	get engine() {
		return admin
	}
	async start(done = () => {}) {console.log(123)
		const { databaseURL } = config

		this.engine.initializeApp({
			credential: this.engine.credential.cert(this.authKey),
			databaseURL
		})

		this.started = true

		done()

		return this
	}
	async send(token, data, done = () => {}) {
		if (!this.started) await this.start()

		for (const [field, value] of Object.entries(data)) {
			if (!value) data[field] = `${value}`
			if (typeof value === 'object') data[field] = JSON.stringify(value)
		}

		const { title = '<empty>', body = '<empty>' } = data

		try {
			await this.engine.messaging().send({
				token,
				notification: {
					title,
					body
				},
				data,
				android: {
					notification: {
						sound: 'default'
					}
				},
				apns: {
					payload: {
						aps: {
							sound: 'default'
						}
					}
				}
			})

			done(true)
		} catch (error) {
			console.log(error)
			done(false, error)
		}
	}
}
