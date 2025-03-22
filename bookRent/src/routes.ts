import { Express } from "express"
import bookRouters from "./modules/books/booksRouters"
import homeRouter from "./modules/homepage/homepageRouter"
import userRouters from "./modules/users/usersRouters"
import routers from "./modules/transactions/transactionsRouters"

function routes(app: Express) {
    app.use(homeRouter)
    app.use(bookRouters)
    app.use(userRouters)
    app.use(routers)
}

export default routes
