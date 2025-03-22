import { Express, Request, Response } from "express"
import swaggerJSDoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"
import fs from "fs"
import path from "path"

const packageJson = JSON.parse(
    fs.readFileSync(path.resolve("package.json"), "utf-8"),
)

const PORT = process.env.PORT || 3000

const Options: swaggerJSDoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "REST API BOOK RENTAL APP",
            version: packageJson.version,
            description:
                "This documentatation is used for technical test only.",
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
            },
        ],
    },
    apis: [
        "src/modules/homepage/homepageRouter.ts",
        "src/modules/books/booksRouters.ts",
        "src/modules/users/usersRouters.ts",
        "src/modules/transactions/transactionsRouters.ts",
    ],
}

const specs = swaggerJSDoc(Options)

function swaggerDocs(app: Express, port: number) {
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs))
    app.get("docs.json", (req: Request, res: Response) => {
        res.setHeader("Content-Type", "application/json")
        res.send(specs)
    })
}

export default swaggerDocs
