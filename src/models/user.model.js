import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

mongoose.pluralize(null)

const collection = 'usuarios'

const schema = new mongoose.Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true },
    age: { type: Number, required: true },
    password: { type: String, required: true }
});

// Importamos mongoose-paginate-v2 y lo activamos como plugin, para tener disponible
// el método paginate() en las consultas
schema.plugin(mongoosePaginate)

export default mongoose.model(collection, schema)