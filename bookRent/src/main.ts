import express from "express"
import routes from "./routes"
import swaggerDocs from "./utils/swagger"
import { schedule } from "./utils/updatePenaltyStatus"

const port = parseInt(process.env.PORT as string) || 4000

const app = express()
app.use(express.json())

export const server = app.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`)
    routes(app)
    swaggerDocs(app, port)
})

//schedule.start() //uncomment this to turn on scheduler

export const closeServer = () => {
    return new Promise((resolve) => {
        server.close(resolve)
    })
}
