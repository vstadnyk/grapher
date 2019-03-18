import fs from 'fs'
import { promisify } from 'util'
import Vue from 'vue'
import VSR from 'vue-server-renderer'

const { createRenderer } = VSR

export default class {
	static async load(src, data = {}) {
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
				data
			})
		)
	}
	static async renderStr(template = '', data = {}, unwrap = false) {
		Vue.config.silent = true

		const str = await createRenderer().renderToString(
			new Vue({
				template: `<span>${template}</span>`,
				data
			})
		)

		return unwrap ? `${str}`.replace(/<[^>]+>/gi, '') : str
	}
}
