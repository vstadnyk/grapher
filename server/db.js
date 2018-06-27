import Sequelize from 'sequelize'

import { db as config } from './config'

export default class DB {
	constructor() {
		this.orm = new Sequelize(...config.connect)
	}
	start() {
		return this.orm.authenticate()
	}
	model(model, types) {
		return this.orm.define(model, types)
	}
}
