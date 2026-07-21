import mongoose from 'mongoose'

const CrudSchema = new mongoose.Schema({
  appid: { type: Number, required: true, unique: true },
  name: String,
  steam_last_modified: Number,
  steam_price_change_number: Number,
  cached_last_modified: Number,
  cached_price_change_number: Number,
  last_data_update: Number,
  last_price_update: Number
}, {
  collection: 'CrudData',
  versionKey: false,
  strict: true
})

const gameSchema = new mongoose.Schema({
  steam_appid: { type: Number, unique: true, required: true },
  name: String,
  is_free: Boolean,
  head: String,
  recs: mongoose.Schema.Types.Mixed,
  rel: mongoose.Schema.Types.Mixed,
  Price: Object,
  lup: { type: Date, default: Date.now }
}, {
  collection: 'AppsData',
  versionKey: false,
  strict: true
})

const comingSoonSchema = new mongoose.Schema({
  steam_appid: { type: Number, unique: true, required: true },
  name: String,
  head: String,
  rel: mongoose.Schema.Types.Mixed,
  lup: { type: Date, default: Date.now }
}, {
  collection: 'AppsData',
  versionKey: false,
  strict: true
})

const freeGameSchema = new mongoose.Schema({
  steam_appid: { type: Number, unique: true, required: true },
  name: String,
  is_free: Boolean,
  head: String,
  lup: { type: Date, default: Date.now }
}, {
  collection: 'AppsData',
  versionKey: false,
  strict: true
})

const Models = {
  GamesSch: mongoose.model('Game', gameSchema),
  ComingSoonSch: mongoose.model('ComingSoonGame', comingSoonSchema),
  FreeGamesSch: mongoose.model('FreeGame', freeGameSchema),
  CrudSch: mongoose.model('CrudData', CrudSchema)
}

export default Models
