import { Router, Request, Response } from "express"
import TransactionService from "./transactionsHandlers"
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../errors"
import { transactionValidator } from "../../utils/validators/transactions"
import { validationResult } from "express-validator"
const routers = Router()
const transactionService = new TransactionService()

/**
 * @openapi
 * /transactions/borrowBooks:
 *   post:
 *     summary: Creating borrowing book data
 *     description: Returns borrowing book transaction data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               memberId:
 *                 type: string
 *                 description: The ID of the member borrowing the book
 *               bookId:
 *                 type: string
 *                 description: The ID of the book to be borrowed
 *             required:
 *               - memberId
 *               - bookId
 *     responses:
 *       201:
 *         description: App is up and running
 *       401:
 *         description: transaction cannot be executed by unauthorized user
 *       400:
 *         description: bad requests while requesting transaction
 *       404:
 *         description: data needed in the process is not found
 *       500:
 *         description: Internal Server Error
 */
routers.post(
    "/transactions/borrowBooks",
    transactionValidator,
    async (req: any, res: any) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Please re-check inputted body and try again.",
                errors: errors.array(),
            })
        }

        const { memberId, bookId } = req.body

        try {
            const borrowTransaction = await transactionService.borrowBooks(
                memberId.toUpperCase(),
                bookId.toUpperCase(),
            )
            return res.status(201).json(borrowTransaction)
        } catch (error) {
            if (error instanceof UnauthorizedError) {
                return res.status(error.statusCode).json({
                    message: "You must login first before borrowing a book.",
                })
            } else if (error instanceof BadRequestError) {
                return res
                    .status(error.statusCode)
                    .json({ message: error.message })
            } else if (error instanceof NotFoundError) {
                return res.status(error.statusCode).json({
                    message: `The book with ID ${bookId} is not found.`,
                })
            } else {
                return res
                    .status(500)
                    .json({ message: "Internal Server Error." })
            }
        }
    },
)

/**
 * @openapi
 * /transactions/returnBooks:
 *   post:
 *     summary: Creating returned book data
 *     description: Returns returned book transaction data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               memberId:
 *                 type: string
 *                 description: The ID of the member borrowing the book
 *               bookId:
 *                 type: string
 *                 description: The ID of the book to be borrowed
 *             required:
 *               - memberId
 *               - bookId
 *     responses:
 *       201:
 *         description: App is up and running
 *       401:
 *         description: transaction cannot be executed by unauthorized user
 *       404:
 *         description: data needed in the process is not found
 *       500:
 *         description: Internal Server Error
 */
routers.post(
    "/transactions/returnBooks",
    transactionValidator,
    async (req: Request, res: Response) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            res.status(400).json({
                message: "Please re-check inputted body and try again",
                errors: errors.array(),
            })
        }
        const { memberId, bookId } = req.body

        try {
            const returnTransaction = await transactionService.returnBooks(
                memberId.toUpperCase(),
                bookId.toUpperCase(),
            )
            res.status(201).json(returnTransaction)
        } catch (error) {
            if (error instanceof UnauthorizedError) {
                res.status(error.statusCode).json({
                    message: "You must login first before returning book",
                })
            } else if (error instanceof BadRequestError) {
                res.status(error.statusCode).json({
                    message: error.message,
                })
            } else if (error instanceof NotFoundError) {
                res.status(error.statusCode).json({
                    message: error.message,
                })
            } else {
                res.status(500).json({ message: "Internal Server Error" })
            }
        }
    },
)

export default routers
