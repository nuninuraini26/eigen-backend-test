import { PrismaClient, transaction_status } from "@prisma/client"
import { BadRequestError, UnauthorizedError, NotFoundError } from "../../errors"

class TransactionService {
    private prisma: PrismaClient
    constructor() {
        this.prisma = new PrismaClient()
    }

    async borrowBooks(memberId: string, bookId: string) {
        try {
            const member = await this.prisma.members.findUnique({
                where: { member_id: memberId },
            })

            if (!member) {
                throw new UnauthorizedError()
            }

            const borrowingData = await this.prisma.transaction.findMany({
                where: {
                    member_id: memberId,
                    category: transaction_status.BORROWING,
                },
            })

            if (borrowingData.length == 2) {
                throw new BadRequestError(
                    "The quota of borrowing a book has been reached, you are not allowed to check out.",
                )
            }

            if (member.is_penalized) {
                throw new BadRequestError(
                    "You are in penalized period, please come back again after your penalty is ended.",
                )
            }

            const result = await this.prisma.$transaction(async (prisma) => {
                const book = await prisma.books.findUnique({
                    where: { book_id: bookId },
                })

                if (!book) {
                    throw new NotFoundError()
                }

                if (book.stock === 0) {
                    throw new BadRequestError(
                        "Sorry, all stocks for this book are borrowed.",
                    )
                }

                await prisma.books.update({
                    where: { book_id: bookId },
                    data: {
                        stock: book.stock - 1,
                    },
                })

                const createTransaction = await prisma.transaction.create({
                    data: {
                        category: transaction_status.BORROWING,
                        book_id: bookId,
                        member_id: memberId,
                        start_date: new Date().toISOString(),
                        due_date: new Date(
                            Date.now() + 7 * 24 * 3600 * 1000,
                        ).toISOString(),
                    },
                })

                return { createTransaction }
            })
            return result
        } catch (error) {
            throw error
        }
    }

    async returnBooks(memberId: string, bookId: string) {
        try {
            const member = await this.prisma.members.findUnique({
                where: { member_id: memberId },
            })

            if (!member) {
                throw new UnauthorizedError()
            }

            const result = await this.prisma.$transaction(async (prisma) => {
                const borrowedBook = await prisma.transaction.findFirst({
                    where: {
                        book_id: bookId,
                        member_id: memberId,
                        category: transaction_status.BORROWING,
                    },
                })

                if (!borrowedBook) {
                    throw new NotFoundError(
                        "You have not borrowed any book yet",
                    )
                }

                if (borrowedBook.due_date) {
                    const dueDayInterval =
                        (new Date().getTime() -
                            Date.parse(borrowedBook.due_date.toString())) /
                        (24 * 3600 * 1000)
                    
                    if (dueDayInterval > 7) {
                        await prisma.members.update({
                            where: { member_id: memberId },
                            data: {
                                is_penalized: true,
                                penalty_start_date: new Date().toISOString(),
                                penalty_end_date: new Date(
                                    Date.now() + 3 * 24 * 3600 * 1000,
                                ).toISOString(),
                            },
                        })
                    }
                }

                const book = await prisma.books.findUnique({
                    where: { book_id: bookId },
                })

                if (!book) {
                    throw new NotFoundError(
                        `The book with ID ${bookId} is not found`,
                    )
                }

                await prisma.books.update({
                    where: { book_id: bookId },
                    data: {
                        stock: book.stock + 1,
                    },
                })

                const updateTransaction = await prisma.transaction.update({
                    where: {
                        id: borrowedBook.id,
                        member_id: borrowedBook.member_id,
                        book_id: borrowedBook.book_id,
                        category: borrowedBook.category,
                        start_date: borrowedBook.start_date,
                        due_date: borrowedBook.due_date,
                    },
                    data: {
                        category: transaction_status.RETURNED,
                        return_date: new Date().toISOString(),
                    },
                })

                return { updateTransaction }
            })
            return result
        } catch (error) {
            throw error
        }
    }
}
export default TransactionService
