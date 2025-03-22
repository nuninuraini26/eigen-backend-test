import { Router } from "express"

const homeRouter = Router()

/**
 * @openapi
 * /:
 *   get:
 *     summary: a general home page endpoint
 *     description: This endpoint is dedicated to home page
 *     responses:
 *       200:
 *         description: This page is intended to be a home page.
 *       500:
 *         description: Internal Server Error
 */
homeRouter.get("/", (req, res) => {
    res.status(200).json({
        message: "This page is intended to be a home page.",
    })
})

export default homeRouter
