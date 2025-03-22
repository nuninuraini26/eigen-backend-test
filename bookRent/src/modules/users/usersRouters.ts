import { Router, Request, Response } from "express"
import UsersService from "./usersHandlers"
import { NotFoundError } from "../../errors"
import { memberIdValidator } from "../../utils/validators/members"
import { validationResult } from "express-validator"

const userRouters = Router()
const usersService = new UsersService()

/**
 * @openapi
 * /members:
 *   get:
 *     summary: Retrieve a list of members
 *     description: Returns all members of the library
 *     responses:
 *       200:
 *         description: App is up and running
 *       500:
 *         description: Internal Server Error
 */
userRouters.get("/members", async (req, res) => {
    try {
        const members = await usersService.getAllMembers()
        res.status(200).json(members)
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" })
    }
})

/**
 * @openapi
 * /members/{id}:
 *   get:
 *     summary: Retrieve a member by ID
 *     description: Returns data about a member based on the provided ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the member data to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A single member data object
 *       404:
 *         description: The member information is not found
 *       500:
 *         description: Internal Server Error
 */
userRouters.get(
    "/members/:id",
    memberIdValidator,
    async (req: Request, res: Response) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            res.status(400).json({
                message: "Please re-check inputted params and try again",
                errors: errors.array(),
            })
            return
        }
        const { id } = req.params
        try {
            const member = await usersService.getMember(id.toUpperCase())
            res.status(200).json(member)
        } catch (error) {
            if (error instanceof NotFoundError) {
                res.status(error.statusCode).json({
                    message: "The member information is not found.",
                })
            } else {
                res.status(500).json({ message: "Internal Server Error" })
            }
        }
    },
)

export default userRouters
