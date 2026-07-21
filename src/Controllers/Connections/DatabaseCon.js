import mongoose from "mongoose"

import Models from "../../Config/Models/GamesSchema.js"

async function DBConnect() {
    try {
        await mongoose.connect(process.env.DBURL)
        return true
    } catch (error) {
        console.log("---------> DB Connection ERROR : " + error)
        return false
    }
  //  return true
}

async function DBinfo(modelName) {

    if (!modelName) { return await mongoose.connection.db.stats() }

    const model = Models[modelName]
    if (!model) { throw new Error("Model not found") }

    return await model.collection.stats()
}

async function GetCount(modelName, filter) {

    const TModel = Models[modelName]
    if (!TModel) throw new Error("Model not found")

    const count = await TModel.countDocuments(filter)
    return count
}

async function SetData(modelName, dataSet) {
    const TModel = Models[modelName]
    if (!TModel) throw new Error("Model not found")
    try {
        const result = await TModel.bulkWrite(dataSet, { ordered: false })
        return true
    } catch (error) { return false }
}

async function GetData(modelName, filter = {}, projection = {}, options = {}) {

    const TModel = Models[modelName]
    if (!TModel) throw new Error("Model not found")

    const data = await TModel.find(filter, projection, options).lean()
    return data
}

export default {
    DBConnect,
    DBinfo,
    GetCount,
    SetData,
    GetData,
}
