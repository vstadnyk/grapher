import * as firebase from 'firebase-admin'
import config from '../firebase-config.json'

export default class {
	async send(token = '', { title = '<empty>', body = '<empty>', data } = {}) {
		const { default: admin } = firebase
		const { authKey, databaseURL } = config || {}

		if (!authKey || !databaseURL) return null

		if (!admin.apps.length) {
			admin.initializeApp({
				credential: admin.credential.cert(authKey),
				databaseURL
			})
		}

		const send = await admin.messaging().send({
			token,
			data,
			notification: {
				title,
				body
			},
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

		return send
	}
}
