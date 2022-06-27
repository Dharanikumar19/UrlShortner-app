const mongoose = require("mongoose")

const UrlSchema = mongoose.Schema({
    longUrl: {
        type: String,
        required : true
    },
    shortUrl: {
        type: String
    }
})


const UrlModel = mongoose.model("urlShort", UrlSchema)

module.exports = { UrlModel }