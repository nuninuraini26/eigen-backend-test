import { PrismaClient, member_status, transaction_status } from "@prisma/client"
import { NotFoundError } from "../../errors"
import { BorrowedBooks } from "../../utils/types"

class UsersService {
    private prisma: PrismaClient

    constructor() {
        this.prisma = new PrismaClient()
    }

    async getAllMembers(): Promise<
        {
            member_id: string
            name: string | null
        }[]
    > {
        try {
            return await this.prisma.members.findMany({
                where: { status: member_status.ACTIVE },
                select: {
                    member_id: true,
                    name: true,
                },
            })
        } catch (error) {
            throw error
        }
    }

    async getMember(id?: string): Promise<{
        member_id: string
        name: string | null
        is_penalized: boolean
        borrowed_books_count: number | null
        borrowed_books_list: BorrowedBooks[]
        status: string
    }> {
        try {
            const borrowedBooks = await this.prisma.transaction.findMany({
                where: {
                    member_id: id,
                    category: transaction_status.BORROWING,
                },
            })
            const result = await this.prisma.members.findUnique({
                where: {
                    member_id: id,
                },
                select: {
                    member_id: true,
                    name: true,
                    is_penalized: true,
                    status: true,
                },
            })
            if (!result) {
                throw new NotFoundError()
            } else {
                return {
                    member_id: result.member_id,
                    name: result.name,
                    is_penalized: result.is_penalized ?? false,
                    borrowed_books_count: borrowedBooks.length ?? 0,
                    borrowed_books_list: borrowedBooks ?? [],
                    status: result.status ?? member_status.INACTIVE,
                }
            }
        } catch (error) {
            throw error
        }
    }
}

export default UsersService
