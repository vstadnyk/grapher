import fs from 'fs'
import { promisify } from 'util'
import Vue from 'vue'
import { createRenderer } from 'vue-server-renderer'

export default class {
	static async get(src, data = {}) {
		let template

		try {
			template = await promisify(fs.readFile)(src, 'utf8')
		} catch (error) {
			console.log(error)

			return error
		}

		return createRenderer().renderToString(
			new Vue({
				template,
				data,
			}),
		)
	}
	static async renderStr(template = '', data = {}, unwrap = false) {
		const str = await createRenderer().renderToString(
			new Vue({
				template: `<span>${template}</span>`,
				data,
			}),
		)

		return unwrap ? `${str}`.replace(/<[^>]+>/gi, '') : str
	}
}
