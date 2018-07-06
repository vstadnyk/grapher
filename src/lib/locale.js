import fs from 'fs'
import glob from 'glob'
import path from 'path'

import Proto from './__proto'
import { locales as config } from '../config'

export default class Locale extends Proto {
	async init() {
		this.dic = new Map()

		return Promise.all(
			glob.sync('./locales/**.json').map(src => ({
				src,
				name: path
					.basename(src)
					.split('.')
					.shift(),
				data: import(path.resolve(src)),
			})),
		)
			.then(data => {
				data
					.filter(f => this.enabled.indexOf(f.name) !== -1)
					.forEach(async f => {
						const _data = await f.data

						this.dic.set(
							f.name,
							Object.keys(_data).reduce(
								(m, i) => m.set(i, _data[i]),
								new Map(),
							),
						)
					})

				return data
			})
			.catch(error => console.log(error))
	}
	get(key, lang = false) {
		if (!this.dic.get(lang || this.current).get(key))
			this.set(key, key.split('_').join(' '), lang)

		return this.dic.get(lang || this.current).get(key) || key
	}
	set(key, value, lang = false) {
		this.dic.get(lang || this.current).set(key, value)

		this.saveDic(lang)

		return this.get(key)
	}
	setObject(obj = {}, lang = false) {
		for (const [key, value] of Object.entries(obj)) {
			if (key && value) {
				this.dic.get(lang || this.current).set(key, value)
			}
		}

		this.saveDic(lang)

		return true
	}
	unsetObject(obj = {}, lang = false) {
		for (const [key, value] of Object.entries(obj)) {
			if (key && value) {
				this.dic.get(lang || this.current).delete(key, value)
			}
		}

		this.saveDic(lang)

		return true
	}
	resetDic(lang = false) {
		this.dic.get(lang || this.current).clear()

		return true
	}
	saveDic(lang = false) {
		fs.writeFileSync(
			`./locales/${lang || this.current}.json`,
			JSON.stringify(this.__objectSort(this.getDic(lang)), null, '\t'),
		)

		return true
	}
	getDic(lang = false, toObject = true) {
		const dic = this.dic.get(lang || this.current)

		if (!toObject) return dic

		return this.__mapToObject(dic)
	}
	get current() {
		return this._current || config.default
	}
	set current(code) {
		this._current = code || config.default
	}
	get config() {
		return config
	}
	get def() {
		return config.default
	}
	get enabled() {
		const { active } = config

		return active
	}
	splitData(
		data = {}, // object arguments
		original = false, // if true return Object for default lang else return array
		langs = {},
	) {
		Object.assign(langs, {
			def: this.def, // string <'en'>
			enabled: this.enabled, // array <['en', ...]>
		})

		const { def, enabled } = langs
		const result = {
			[def]: {},
		}

		for (const [field, value] of Object.entries(data)) {
			if (
				value &&
				typeof value === 'object' &&
				value.find &&
				value.find(row => row.lang && enabled.indexOf(row.lang) !== -1)
			) {
				value.forEach(row => {
					const { lang } = row
					const item = {
						lang,
						[field]: row.value,
					}

					if (result[lang]) {
						Object.assign(result[lang], item)
					} else {
						result[lang] = item
					}
				})
			} else {
				Object.assign(result[def], {
					[field]: value,
				})
			}
		}

		if (!original) return Object.values(result).filter(row => row.lang !== def)

		return result[def]
	}
	splitItem(item = {}, fields = ['name']) {
		const lang = this.def

		for (const [field, value] of Object.entries(item)) {
			if (fields.indexOf(field) !== -1) {
				Object.assign(item, {
					[field]: [
						{
							lang,
							value,
						},
					],
				})
			} else {
				Object.assign(item, {
					[field]: value,
				})
			}
		}

		return item
	}
	// get translateble fields from Sequelize schema fields
	getFields(fields, key = 'translate') {
		return Object.entries(fields)
			.map(([field, data]) => (data[key] ? field : false))
			.filter(row => row)
	}
}
