import i18n from "i18n"
import { join } from "path"
import { config } from "../utils/ConfigUtils"

i18n.configure({
    locales: ["en", "fr"],
    directory: join(__dirname, ".", "locales"),
    defaultLocale: "en",
    retryInDefaultLocale: true,
    objectNotation: true,
    register: global,

    logWarnFn: function (msg) {
        console.log(msg)
    },

    logErrorFn: function (msg) {
        console.error(msg)
    },

    missingKeyFn: function (locale, value) {
        return value
    },

    mustacheConfig: {
        tags: ["{{", "}}"],
        disable: false
    }
})

i18n.setLocale(config.discord.locale)

export { i18n }
