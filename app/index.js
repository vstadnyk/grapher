import fs from 'fs'
import glob from 'glob'
import path from 'path'
import { promisify } from 'util'
import Vue from 'vue'
import { createRenderer } from 'vue-server-renderer'

import Proto from '../server/__proto'
import { publicName, version } from '../package.json'

export default class extends Proto {
	constructor(ctx) {
		super()

		this.ctx = ctx
	}
	async getTemplate(file) {
		let template = null

		try {
			template = await promisify(fs.readFile)(
				path.join(__dirname, file),
				'utf8'
			)
		} catch (error) {
			return null
		}

		return template
	}
	async body() {
		const template = await this.getTemplate('index.html')

		if (!template) {
			this.ctx.status = 404
			this.ctx.body = 'Not found'

			return null
		}

		const app = new Vue({
			template: `<div><Index name="${publicName}" version="${version}"/></div>`,
			components: await this.components()
		})

		const context = {
			title: `${publicName} v${version}`,
			meta: `
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="X-UA-Compatible" content="ie=edge">
				<link href="assets/css/arckane.min.css" rel="stylesheet">
    			<link href="assets/css/styles.css" rel="stylesheet">
            `
		}

		this.ctx.body = await createRenderer({ template }).renderToString(
			app,
			context
		)

		return true
	}
	async components() {
		const components = {}

		const files = await promisify(glob)(
			path.join(__dirname, '/components/*.js')
		)

		for (const src of files) {
			const { name, component } = await this.loadComponent(src)

			Object.assign(components, {
				[name]: component
			})
		}

		return components
	}
	async loadComponent(src) {
		const { default: Component } = await import(src)

		const component = new Component()
		const { name } = component.constructor

		const template = await this.getTemplate(
			`/view/${name.toLowerCase()}.html`
		)

		if (template) Object.assign(component, { template })

		if (component.data) Object.assign(component, { data: component.data })

		return {
			name,
			component: Vue.component(name, component)
		}
	}
}
