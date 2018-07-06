import KoaRouter from 'koa-router'

export default class Router {
	constructor() {
		this.engine = new KoaRouter()
	}
	initialize() {
		return this.engine
	}
}
