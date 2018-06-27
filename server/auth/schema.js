import Thinky from 'thinky'

const {
    type
} = new Thinky()

export default {
    id: type.string(),
    mail: type.string().email(),
    pass: type.buffer(),
    salt: type.string()
}