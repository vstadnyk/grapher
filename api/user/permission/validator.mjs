import Proto from '../../../lib/proto/validator'

export default class extends Proto {
	constructor(parent) {
		super()

		this.parent = parent
	}
	async validateModyfi(data) {
		const { alias } = data

		if (await this.parent.exist({ alias })) throw this.parent.error('exists')

		return data
	}
	async validateRule(rule = null) {
		if (!this.parent.rules) await this.parent.loadRules()

		const { rules, loger } = this.parent

		const { userPermissions: file } = loger.config

		if (!rules.has(rule)) {
			rules.add(rule)

			const arr = [...rules]

			arr.sort()

			await loger.write(file, arr, {
				addDate: false,
				merge: false
			})
		}

		return rule
	}
}
