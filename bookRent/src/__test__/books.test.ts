import request from "supertest"
import { PrismaClient } from "@prisma/client"
import BookService from "../modules/books/booksHandlers"
import { NotFoundError } from "../errors"
import { GetBook } from "../utils/types"
import { server, closeServer } from "../main"

// Mock PrismaClient
jest.mock("@prisma/client", () => {
    const mockPrisma = {
        transaction: {
            findMany: jest.fn(),
        },
        books: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
    }
    return {
        PrismaClient: jest.fn(() => mockPrisma),
    }
})

describe("BookService", () => {
    let bookService: BookService
    let mockPrisma: any

    beforeEach(() => {
        mockPrisma = new PrismaClient()
        bookService = new BookService(mockPrisma)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe("getAllBooks", () => {
        it("should return a list of available books", async () => {
            const mockBorrowedBooks = [
                {
                    book_id: "JK-45",
                    title: "Harry Potter",
                    author: "J.K Rowling",
                    stock: 1,
                },
                {
                    book_id: "HOB-83",
                    title: "The Hobbit, or There and Back Again",
                    author: "J.R.R. Tolkien",
                    stock: 1,
                },
                {
                    book_id: "NRN-7",
                    title: "The Lion, the Witch and the Wardrobe",
                    author: "C.S. Lewis",
                    stock: 1,
                },
            ]
            const mockAllBooks = [
                {
                    book_id: "SHR-1",
                    title: "A Study in Scarlet",
                    author: "Arthur Conan Doyle",
                    stock: 1,
                },
                {
                    book_id: "TW-11",
                    title: "Twilight",
                    author: "Stephenie Meyer",
                    stock: 1,
                },
            ]

            mockPrisma.transaction.findMany.mockResolvedValue(mockBorrowedBooks)
            mockPrisma.books.findMany.mockResolvedValue(mockAllBooks)

            const result = await bookService.getAllBooks()

            expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
                where: { category: "BORROWING" },
                select: { book_id: true },
            })
            expect(mockPrisma.books.findMany).toHaveBeenCalledWith({
                where: {
                    NOT: {
                        book_id: {
                            in: ["JK-45", "HOB-83", "NRN-7"],
                        },
                    },
                },
                select: {
                    book_id: true,
                    title: true,
                    author: true,
                    stock: true,
                },
            })
            expect(result).toEqual(mockAllBooks)
        })

        it("should handle errors from Prisma", async () => {
            mockPrisma.transaction.findMany.mockRejectedValue(
                new Error("Prisma error"),
            )

            await expect(bookService.getAllBooks()).rejects.toThrow(
                "Prisma error",
            )
        })
    })

    describe("getBook", () => {
        afterAll(async () => {
            await closeServer()
        })
        it("should return 400 and errors if id is not valid", async () => {
            const response = await request(server).get("/books/m333")

            expect(response.status).toBe(400)
            expect(response.body).toEqual({
                message: "Please re-check inputted params and try again",
                errors: expect.any(Array),
            })
        })

        it("should return a book when found", async () => {
            const mockBook: GetBook = {
                book_id: "TW-11",
                title: "Twilight",
                author: "Stephenie Meyer",
                stock: 1,
            }

            mockPrisma.books.findUnique.mockResolvedValue(mockBook)

            const result = await bookService.getBook("TW-11")

            expect(mockPrisma.books.findUnique).toHaveBeenCalledWith({
                where: { book_id: "TW-11" },
                select: {
                    book_id: true,
                    title: true,
                    author: true,
                    stock: true,
                },
            })
            expect(result).toStrictEqual(mockBook)
        })

        it("should throw NotFoundError when book is not found", async () => {
            mockPrisma.books.findUnique.mockResolvedValue(null)

            await expect(bookService.getBook("TW-11")).rejects.toThrow(
                NotFoundError,
            )
        })

        it("should handle errors from Prisma", async () => {
            mockPrisma.books.findUnique.mockRejectedValue(
                new Error("Prisma error"),
            )

            await expect(bookService.getBook("TW-11")).rejects.toThrow(
                "Prisma error",
            )
        })
    })
})
