import fs from 'fs'
import { promisify } from 'util'
import path from 'path'

import Proto from '../lib/__proto'
import { locales as config } from '../config'

export default class Locale extends Proto {
	constructor() {
		super()

		this.dic = this.__objectToMap({})
		this.storage = this.__objectToMap({})
	}
	get current() {
		return this._current || config.default
	}
	set current(code) {
		this._current = code
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
	async initialize() {
		const { directory } = this.config

		const files = this.enabled.map(code =>
			path.resolve(directory.concat(code, '.json'))
		)

		if (!fs.existsSync(directory)) await promisify(fs.mkdir)(directory)

		await Promise.all(
			files
				.filter(file => !fs.existsSync(file))
				.map(file => promisify(fs.writeFile)(file, '{}'))
		)

		const imported = await Promise.all(files.map(file => import(file)))

		imported.forEach(({ default: data }, i) => {
			this.dic.set(this.enabled[i], this.__objectToMap(data))
		})
	}
	get(key = null, lang = null) {
		if (!this.dic.get(lang || this.current).get(key))
			this.set(key, key.split('_').join(' '), lang)

		return this.dic.get(lang || this.current).get(key) || key
	}
	set(key, value, lang = null) {
		this.dic.get(lang || this.current).set(key, value)

		this.saveDic(lang)

		return this.get(key)
	}
	setObject(obj = {}, lang = null) {
		for (const [key, value] of Object.entries(obj)) {
			if (key && value) {
				this.dic.get(lang || this.current).set(key, value)
			}
		}

		return true
	}
	unsetObject(obj = {}, lang = null) {
		for (const [key, value] of Object.entries(obj)) {
			if (key && value) {
				this.dic.get(lang || this.current).delete(key, value)
			}
		}

		this.saveDic(lang)

		return true
	}
	resetDic(lang = null) {
		this.dic.get(lang || this.current).clear()

		return true
	}
	async saveDic(lang = null) {
		await promisify(fs.writeFile)(
			config.directory.concat(`${lang || this.current}.json`),
			JSON.stringify(this.__objectSort(this.getDic(lang)), null, '\t')
		)

		return true
	}
	getDic(lang = null, toObject = true) {
		const dic = this.dic.get(lang || this.current)

		if (!toObject) return dic

		return this.__objectSort(this.__mapToObject(dic))
	}
	splitData(
		data = {}, // object arguments
		original = false, // if true return Object for default lang else return array
		langs = {}
	) {
		Object.assign(langs, {
			def: this.def, // string <'en'>
			enabled: this.enabled // array <['en', ...]>
		})

		const { def, enabled } = langs
		const result = {
			[def]: {}
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
						[field]: row.value
					}

					if (result[lang]) {
						Object.assign(result[lang], item)
					} else {
						result[lang] = item
					}
				})
			} else {
				Object.assign(result[def], {
					[field]: value
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
							value
						}
					]
				})
			} else {
				Object.assign(item, {
					[field]: value
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
