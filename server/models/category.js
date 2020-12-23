var mongoose = require("mongoose");

var categoryschama = require("../schemas/category");

module.exports = mongoose.model("Category", categoryschama);