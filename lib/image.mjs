import fs from 'fs'
import download from 'download'
import shelljs from 'shelljs'
import fileType from 'file-type'
import { promisify } from 'util'
import inflected from 'inflected'

import { uploadDir, staticPath, allowedMime } from '../config'

const { mkdir } = shelljs
const { transliterate, parameterize } = inflected

export default class Image {
	get image() {
		return this._image || false
	}
	set image(image = {}) {
		this._image = image

		return this._image
	}
	set(image = {}) {
		this.image = image

		return this
	}
	base64ToBuffer(str = '') {
		if (typeof str !== 'string') return this

		const mime = this.base64GetMime(str)

		if (!mime) return null

		return this.set({
			mime,
			ext: this.base64GetExtension(str),
			buffer: Buffer.from(str.replace(/^data:image\/\w+;base64,/, ''), 'base64')
		})
	}
	base64GetMime(str = '') {
		const mime = str.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)

		if (!mime || !mime.length) return null

		return mime[1]
	}
	base64GetExtension(str = '') {
		const mime = this.base64GetMime(str)

		if (!mime) return null

		return mime.split('/').pop()
	}
	async upload(options = {}, overWrite = false) {
		if (!this.image) return this.image

		if (allowedMime.indexOf(this.image.mime) === -1)
			throw new Error(
				`Image upload error: "Mime type ${this.image.mime} is not allowed"`
			)

		const o = Object.assign(
			{},
			{
				dir: false, // path only
				src: false, // path with file
				filename: `upload_${new Date().valueOf()}` // any encoded string
			},
			options
		)

		Object.assign(o, {
			dir: uploadDir.concat(o.dir),
			filename: parameterize(transliterate(o.filename), { separator: '_' })
		})

		if (!o.src) {
			Object.assign(o, {
				src: o.dir.concat('/', o.filename, '.', this.image.ext)
			})
		}

		if (!(await promisify(fs.exists)(o.dir))) {
			try {
				mkdir('-p', o.dir)
			} catch (error) {
				throw new Error(
					`Image upload error: "Can not create directory ${o.dir}, ${error}"`
				)
			}
		}

		if (!overWrite) {
			if (await promisify(fs.exists)(o.src)) {
				Object.assign(o, {
					src: o.dir.concat(
						'/',
						o.filename,
						new Date().valueOf(),
						'.',
						this.image.ext
					)
				})
			}
		}

		try {
			await promisify(fs.writeFile)(o.src, this.image.buffer)
		} catch (error) {
			throw new Error(`Image upload error: "${error}"`)
		}

		return o.src.replace('./'.concat(staticPath), '')
	}
	async unlink(src = '') {
		const file = './'.concat(staticPath, src)

		if (await promisify(fs.exists)(file)) {
			try {
				await promisify(fs.unlink)(file)
			} catch (error) {
				console.log(error)
			}
		}

		return true
	}
	async download(url = false) {
		const buffer = await download(url)

		return Object.assign({}, fileType(buffer), { buffer })
	}
}
