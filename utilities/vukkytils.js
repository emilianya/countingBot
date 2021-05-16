// Copyright (C) 2020-2021 Vukky

const vukkytils = require("@vukkyutils/localization");
const config = require("../config.json");

vukkytils.setLanguage("en");
vukkytils.setSplitLanguagesMode(true);
vukkytils.setSplitLanguagesLocation("../strings");

module.exports = vukkytils;
