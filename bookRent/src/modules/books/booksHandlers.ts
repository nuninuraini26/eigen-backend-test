import { PrismaClient } from "@prisma/client"
import { NotFoundError } from "../../errors"
import { GetBook } from "../../utils/types"

class BookService {
    private prisma: PrismaClient

    constructor(prisma?: PrismaClient) {
        this.prisma = new PrismaClient()
    }

    async getAllBooks(): Promise<GetBook[]> {
        try {
            const borrowedBooks = await this.prisma.transaction.findMany({
                where: {
                    category: "BORROWING",
                },
                select: {
                    book_id: true,
                },
            })

            const borrowedBookIds = borrowedBooks
                .map((transaction) => transaction.book_id)
                .filter((bookId) => bookId !== null)

            return await this.prisma.books.findMany({
                where: {
                    NOT: {
                        book_id: {
                            in: borrowedBookIds,
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
        } catch (error) {
            throw error
        }
    }

    async getBook(id: string): Promise<GetBook> {
        try {
            const result = await this.prisma.books.findUnique({
                where: {
                    book_id: id,
                },
                select: {
                    book_id: true,
                    title: true,
                    author: true,
                    stock: true,
                },
            })
            if (!result) {
                throw new NotFoundError()
            } else {
                return result
            }
        } catch (error) {
            throw error
        }
    }
}

export default BookService
