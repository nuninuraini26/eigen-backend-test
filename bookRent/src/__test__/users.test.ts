import request from "supertest"
import { PrismaClient, member_status, transaction_status } from "@prisma/client"
import UsersService from "../modules/users/usersHandlers"
import { NotFoundError } from "../errors"
import { BorrowedBooks } from "../utils/types"
import { server, closeServer } from "../main"

// Mock PrismaClient and its enums
jest.mock("@prisma/client", () => {
    const mockPrisma = {
        members: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
        transaction: {
            findMany: jest.fn(),
        },
    }

    return {
        PrismaClient: jest.fn(() => mockPrisma),
        member_status: {
            ACTIVE: "ACTIVE",
            INACTIVE: "INACTIVE",
        },
        transaction_status: {
            BORROWING: "BORROWING",
        },
    }
})

describe("UsersService", () => {
    let usersService: UsersService
    let mockPrisma: any

    beforeEach(() => {
        mockPrisma = new PrismaClient()
        usersService = new UsersService()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe("getAllMembers", () => {
        it("should return a list of active members", async () => {
            const mockMembers = [
                {
                    member_id: "M001",
                    name: "Angga",
                },
                {
                    member_id: "M002",
                    name: "Ferry",
                },
                {
                    member_id: "M003",
                    name: "Putri",
                },
            ]

            mockPrisma.members.findMany.mockResolvedValue(mockMembers)

            const result = await usersService.getAllMembers()

            expect(mockPrisma.members.findMany).toHaveBeenCalledWith({
                where: { status: "ACTIVE" },
                select: { member_id: true, name: true },
            })
            expect(result).toEqual(mockMembers)
        })

        it("should handle errors from Prisma", async () => {
            mockPrisma.members.findMany.mockRejectedValue(
                new Error("Prisma error"),
            )

            await expect(usersService.getAllMembers()).rejects.toThrow(
                "Prisma error",
            )
        })
    })

    describe("getMember", () => {
        const mockMember = {
            member_id: "M001",
            name: "Angga",
            is_penalized: false,
            status: "ACTIVE",
        }

        const mockBorrowedBooks: BorrowedBooks[] = [
            {
                book_id: "JK-45",
                member_id: "M001",
                id: "transaction1",
                category: "BORROWING",
                start_date: new Date("2025-01-01"),
                due_date: new Date("2025-01-08"),
                return_date: null,
            },
        ]
        afterAll(async () => {
            await closeServer()
        })
        it("should return 400 and errors if id is not valid", async () => {
            const response = await request(server).get("/members/jk-45")

            expect(response.status).toBe(400)
            expect(response.body).toEqual({
                message: "Please re-check inputted params and try again",
                errors: expect.any(Array),
            })
        })
        it("should return member details when found", async () => {
            mockPrisma.members.findUnique.mockResolvedValue(mockMember)
            mockPrisma.transaction.findMany.mockResolvedValue(mockBorrowedBooks)

            const result = await usersService.getMember("M001")

            expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
                where: { member_id: "M001", category: "BORROWING" },
            })
            expect(mockPrisma.members.findUnique).toHaveBeenCalledWith({
                where: { member_id: "M001" },
                select: {
                    member_id: true,
                    name: true,
                    is_penalized: true,
                    status: true,
                },
            })
            expect(result).toEqual({
                ...mockMember,
                borrowed_books_count: mockBorrowedBooks.length,
                borrowed_books_list: mockBorrowedBooks,
            })
        })

        it("should throw NotFoundError when member is not found", async () => {
            mockPrisma.members.findUnique.mockResolvedValue(null)

            await expect(usersService.getMember("M005")).rejects.toThrow(
                NotFoundError,
            )
        })

        it("should handle errors from Prisma when fetching member", async () => {
            mockPrisma.members.findUnique.mockRejectedValue(
                new Error("Prisma error"),
            )

            await expect(usersService.getMember("M001")).rejects.toThrow(
                "Prisma error",
            )
        })

        it("should handle errors from Prisma when fetching borrowed books", async () => {
            mockPrisma.members.findUnique.mockResolvedValue(mockMember)
            mockPrisma.transaction.findMany.mockRejectedValue(
                new Error("Prisma error"),
            )

            await expect(usersService.getMember("M001")).rejects.toThrow(
                "Prisma error",
            )
        })

        it("should return correct values when no books are borrowed", async () => {
            mockPrisma.members.findUnique.mockResolvedValue(mockMember)
            mockPrisma.transaction.findMany.mockResolvedValue([])

            const result = await usersService.getMember("M001")

            expect(result).toEqual({
                ...mockMember,
                borrowed_books_count: 0,
                borrowed_books_list: [],
            })
        })
    })
})
