import { $Enums } from "@prisma/client"

export interface GetBook {
    book_id: string
    title: string | null
    author: string | null
    stock: number | null
}

export interface BorrowedBooks {
    book_id: string | null
    member_id: string | null
    id: string
    category: $Enums.transaction_status | null
    start_date: Date | null
    due_date: Date | null
    return_date: Date | null
}
