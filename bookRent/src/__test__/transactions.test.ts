import request from "supertest"
import { PrismaClient, transaction_status } from "@prisma/client"
import TransactionService from "../modules/transactions/transactionsHandlers"
import { BadRequestError, UnauthorizedError, NotFoundError } from "../errors"
import { server, closeServer } from "../main"

// Mock PrismaClient and its enums
jest.mock("@prisma/client", () => {
    const mockPrisma = {
        members: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        books: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        transaction: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        $transaction: jest.fn(),
    }

    return {
        PrismaClient: jest.fn(() => mockPrisma),
        transaction_status: {
            BORROWING: "BORROWING",
            RETURNED: "RETURNED",
        },
    }
})

const mockMember = { member_id: "M001", is_penalized: false }
const mockBook = { book_id: "JK-45", stock: 1 }
const mockTransaction = { id: "transaction1" }
describe("TransactionService", () => {
    let transactionService: TransactionService
    let mockPrisma: any

    beforeEach(() => {
        mockPrisma = new PrismaClient()
        transactionService = new TransactionService()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })
    afterAll(async () => {
        await closeServer()
    })

    describe("borrowBooks", () => {
        it("should return 400 and errors if request body is invalid", async () => {
            const invalidPayload = {
                memberId: "jk-45",
                bookId: "m002",
            }

            const response = await request(server)
                .post("/transactions/borrowBooks")
                .send(invalidPayload)

            expect(response.status).toBe(400)
            expect(response.body).toEqual({
                message: "Please re-check inputted body and try again.",
                errors: expect.any(Array),
            })

            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: "Member ID must be string started with 'm' or 'M' and followed by at least 3 digits",
                    }),
                    expect.objectContaining({
                        msg: "Book ID must be string consisted of alphabetic characters followed by a hyphen and at least 1 digit",
                    }),
                ]),
            )
        })
        it("should successfully borrow a book", async () => {
            mockPrisma.members.findUnique.mockResolvedValue(mockMember)
            mockPrisma.transaction.findMany.mockResolvedValue([])
            mockPrisma.$transaction.mockImplementation(
                (callback: (prisma: PrismaClient) => Promise<any>) =>
                    callback(mockPrisma),
            )
            mockPrisma.books.findUnique.mockResolvedValue(mockBook)
            mockPrisma.books.update.mockResolvedValue(mockBook)
            mockPrisma.transaction.create.mockResolvedValue(mockTransaction)

            const result = await transactionService.borrowBooks(
                mockMember.member_id,
                mockBook.book_id,
            )

            expect(mockPrisma.members.findUnique).toHaveBeenCalledWith({
                where: { member_id: mockMember.member_id },
            })
            expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
                where: {
                    member_id: mockMember.member_id,
                    category: "BORROWING",
                },
            })
            expect(mockPrisma.$transaction).toHaveBeenCalled()
            expect(mockPrisma.books.findUnique).toHaveBeenCalledWith({
                where: { book_id: mockBook.book_id },
            })
            expect(mockPrisma.books.update).toHaveBeenCalledWith({
                where: { book_id: mockBook.book_id },
                data: { stock: 0 },
            })
            expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
                data: {
                    category: "BORROWING",
                    book_id: mockBook.book_id,
                    member_id: mockMember.member_id,
                    start_date: expect.any(String),
                    due_date: expect.any(String),
                },
            })
            expect(result).toEqual({ createTransaction: mockTransaction })
        })

        it("should throw UnauthorizedError if member is not found", async () => {
            mockPrisma.members.findUnique.mockResolvedValue(null)

            await expect(
                transactionService.borrowBooks(
                    mockMember.member_id,
                    mockBook.book_id,
                ),
            ).rejects.toThrow(UnauthorizedError)
        })

        it("should throw BadRequestError if member has reached borrowing quota", async () => {
            mockPrisma.members.findUnique.mockResolvedValue({
                member_id: mockMember.member_id,
            })
            mockPrisma.transaction.findMany.mockResolvedValue([{}, {}])

            await expect(
                transactionService.borrowBooks(
                    mockMember.member_id,
                    mockBook.book_id,
                ),
            ).rejects.toThrow(BadRequestError)
            await expect(
                transactionService.borrowBooks(
                    mockMember.member_id,
                    mockBook.book_id,
                ),
            ).rejects.toThrow(
                "The quota of borrowing a book has been reached, you are not allowed to check out.",
            )
        })

        it("should throw BadRequestError if member is penalized", async () => {
            mockPrisma.members.findUnique.mockResolvedValue({
                member_id: mockMember.member_id,
                is_penalized: true,
            })
            mockPrisma.transaction.findMany.mockResolvedValue([])

            await expect(
                transactionService.borrowBooks(
                    mockMember.member_id,
                    mockBook.book_id,
                ),
            ).rejects.toThrow(BadRequestError)
            await expect(
                transactionService.borrowBooks(
                    mockMember.member_id,
                    mockBook.book_id,
                ),
            ).rejects.toThrow(
                "You are in penalized period, please come back again after your penalty is ended.",
            )
        })

        it("should throw NotFoundError if book is not found", async () => {
            mockPrisma.members.findUnique.mockResolvedValue({
                member_id: mockMember.member_id,
            })
            mockPrisma.transaction.findMany.mockResolvedValue([])
            mockPrisma.$transaction.mockImplementation(
                (callback: (prisma: PrismaClient) => Promise<any>) =>
                    callback(mockPrisma),
            )
            mockPrisma.books.findUnique.mockResolvedValue(null)

            await expect(
                transactionService.borrowBooks(
                    mockMember.member_id,
                    mockBook.book_id,
                ),
            ).rejects.toThrow(NotFoundError)
        })

        it("should throw BadRequestError if book stock is zero", async () => {
            mockPrisma.members.findUnique.mockResolvedValue({
                member_id: mockMember.member_id,
            })
            mockPrisma.transaction.findMany.mockResolvedValue([])
            mockPrisma.$transaction.mockImplementation(
                (callback: (prisma: PrismaClient) => Promise<any>) =>
                    callback(mockPrisma),
            )
            mockPrisma.books.findUnique.mockResolvedValue({
                book_id: mockBook.book_id,
                stock: 0,
            })

            await expect(
                transactionService.borrowBooks(
                    mockMember.member_id,
                    mockBook.book_id,
                ),
            ).rejects.toThrow(BadRequestError)
            await expect(
                transactionService.borrowBooks(
                    mockMember.member_id,
                    mockBook.book_id,
                ),
            ).rejects.toThrow("Sorry, all stocks for this book are borrowed.")
        })
    })

    describe("returnBooks", () => {
        it("should successfully return a book", async () => {
            const mockMember = { member_id: "M001" }
            const mockBorrowedBook = {
                id: "transaction1",
                book_id: "JK-45",
                member_id: "M001",
                category: "BORROWING",
                start_date: new Date("2025-01-01T00:00:00.000Z").toISOString(),
                due_date: new Date("2025-01-08T00:00:00.000Z").toISOString(),
            }
            const mockBook = { book_id: "JK-45", stock: 0 }
            const mockUpdatedTransaction = {
                id: "transaction1",
                category: "RETURNED",
            }

            mockPrisma.members.findUnique.mockResolvedValue(mockMember)
            mockPrisma.$transaction.mockImplementation(
                (callback: (prisma: PrismaClient) => Promise<any>) =>
                    callback(mockPrisma),
            )
            mockPrisma.transaction.findFirst.mockResolvedValue(mockBorrowedBook)
            mockPrisma.books.findUnique.mockResolvedValue(mockBook)
            mockPrisma.books.update.mockResolvedValue(mockBook)
            mockPrisma.transaction.update.mockResolvedValue(
                mockUpdatedTransaction,
            )

            const result = await transactionService.returnBooks("M001", "JK-45")

            expect(mockPrisma.members.findUnique).toHaveBeenCalledWith({
                where: { member_id: "M001" },
            })
            expect(mockPrisma.$transaction).toHaveBeenCalled()
            expect(mockPrisma.transaction.findFirst).toHaveBeenCalledWith({
                where: {
                    book_id: "JK-45",
                    member_id: "M001",
                    category: "BORROWING",
                },
            })
            expect(mockPrisma.books.findUnique).toHaveBeenCalledWith({
                where: { book_id: "JK-45" },
            })
            expect(mockPrisma.books.update).toHaveBeenCalledWith({
                where: { book_id: "JK-45" },
                data: { stock: 1 },
            })
            expect(mockPrisma.transaction.update).toHaveBeenCalledWith({
                where: {
                    id: "transaction1",
                    member_id: "M001",
                    book_id: "JK-45",
                    category: "BORROWING",
                    start_date: mockBorrowedBook.start_date,
                    due_date: mockBorrowedBook.due_date,
                },
                data: {
                    category: "RETURNED",
                    return_date: expect.any(String),
                },
            })
            expect(result).toEqual({
                updateTransaction: mockUpdatedTransaction,
            })
        })

        it("should throw UnauthorizedError if member is not found", async () => {
            mockPrisma.members.findUnique.mockResolvedValue(null)

            await expect(
                transactionService.returnBooks("M001", "JK-45"),
            ).rejects.toThrow(UnauthorizedError)
        })

        it("should throw NotFoundError if borrowed book is not found", async () => {
            mockPrisma.members.findUnique.mockResolvedValue({
                member_id: "M001",
            })
            mockPrisma.$transaction.mockImplementation(
                (callback: (prisma: PrismaClient) => Promise<any>) =>
                    callback(mockPrisma),
            )
            mockPrisma.transaction.findFirst.mockResolvedValue(null)

            await expect(
                transactionService.returnBooks("M001", "JK-45"),
            ).rejects.toThrow(NotFoundError)
            await expect(
                transactionService.returnBooks("M001", "JK-45"),
            ).rejects.toThrow("You have not borrowed any book yet")
        })

        it("should penalize member if book is returned late", async () => {
            const mockMember = { member_id: "M001" }
            const mockBorrowedBook = {
                id: "transaction1",
                book_id: "JK-45",
                member_id: "M001",
                category: "BORROWING",
                start_date: new Date("2025-01-01T00:00:00.000Z").toISOString(),
                due_date: new Date("2025-01-08T00:00:00.000Z").toISOString(),
            }
            const mockBook = { book_id: "JK-45", stock: 0 }
            const mockUpdatedTransaction = {
                id: "transaction1",
                category: "RETURNED",
            }

            mockPrisma.members.findUnique.mockResolvedValue(mockMember)
            mockPrisma.$transaction.mockImplementation(
                (callback: (prisma: PrismaClient) => Promise<any>) => {
                    return callback(mockPrisma)
                },
            )
            mockPrisma.transaction.findFirst.mockResolvedValue(mockBorrowedBook)
            mockPrisma.books.findUnique.mockResolvedValue(mockBook)
            mockPrisma.books.update.mockResolvedValue(mockBook)
            mockPrisma.members.update.mockResolvedValue(mockMember)
            mockPrisma.transaction.update.mockResolvedValue(
                mockUpdatedTransaction,
            )

            class MockDate extends Date {
                constructor() {
                    super("2025-01-16T00:00:00.000Z")
                }
                static now() {
                    return new MockDate().getTime()
                }
            }

            const originalDate = global.Date

            global.Date = MockDate as any

            const result = await transactionService.returnBooks("M001", "JK-45")
            expect(mockPrisma.members.update).toHaveBeenCalledWith({
                where: { member_id: "M001" },
                data: {
                    is_penalized: true,
                    penalty_start_date: new Date().toISOString(),
                    penalty_end_date: new Date(
                        Date.now() + 3 * 24 * 3600 * 1000,
                    ).toISOString(),
                },
            })

            global.Date = originalDate
        })

        it("should throw NotFoundError if book is not found", async () => {
            const mockMember = { member_id: "M001" }
            const mockBorrowedBook = {
                id: "transaction1",
                book_id: "JK-45",
                member_id: "M001",
                category: "BORROWING",
                start_date: new Date().toISOString(),
                due_date: new Date().toISOString(),
            }

            mockPrisma.members.findUnique.mockResolvedValue(mockMember)
            mockPrisma.$transaction.mockImplementation(
                (callback: (prisma: PrismaClient) => Promise<any>) =>
                    callback(mockPrisma),
            )
            mockPrisma.transaction.findFirst.mockResolvedValue(mockBorrowedBook)
            mockPrisma.books.findUnique.mockResolvedValue(null)

            await expect(
                transactionService.returnBooks("M001", "JK-45"),
            ).rejects.toThrow(NotFoundError)
            await expect(
                transactionService.returnBooks("M001", "JK-45"),
            ).rejects.toThrow("The book with ID JK-45 is not found")
        })
    })
})
