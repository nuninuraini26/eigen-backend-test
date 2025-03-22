import { Router, Request, Response } from "express"
import BookService from "./booksHandlers"
import { NotFoundError } from "../../errors"
import { bookIdValidator } from "../../utils/validators/books"
import { validationResult } from "express-validator"

const bookRouters = Router()
const bookService = new BookService()

/**
 * @openapi
 * /books:
 *   get:
 *     summary: Retrieve a list of books
 *     description: Returns all books from the library
 *     responses:
 *       200:
 *         description: App is up and running
 *       500:
 *         description: Internal Server Error
 */
bookRouters.get("/books", async (req, res) => {
    try {
        const books = await bookService.getAllBooks()
        res.status(200).json(books)
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" })
    }
})

/**
 * @openapi
 * /books/{id}:
 *   get:
 *     summary: Retrieve a book by ID
 *     description: Returns a single book based on the provided ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the book to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A single book object
 *       400:
 *         description: bad request on request params
 *       404:
 *         description: The book is not found
 *       500:
 *         description: Internal Server Error
 */
bookRouters.get(
    "/books/:id",
    bookIdValidator,
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
            const book = await bookService.getBook(id.toUpperCase())
            res.status(200).json(book)
        } catch (error) {
            if (error instanceof NotFoundError) {
                res.status(error.statusCode).json({
                    message: "The book you are looking for is not available.",
                })
            } else {
                res.status(500).json({ message: "Internal Server Error" })
            }
        }
    },
)

export default bookRouters
