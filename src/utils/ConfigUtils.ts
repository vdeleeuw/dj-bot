import { Config } from "../models"

let config: Config

try {
    config = require("../../config.json")
} catch (error) {
    config = {
        discord: {
            token: "",
            idle_time: 30,
            locale: "en"
        },
        spotify: {
            client_id: "",
            client_secret: ""
        }
    }
}

export { config }
