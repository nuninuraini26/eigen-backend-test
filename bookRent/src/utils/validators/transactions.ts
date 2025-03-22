import { body } from "express-validator"

export const transactionValidator = [
    body("memberId")
        .isString()
        .matches(/^[M-m]\d{2,}$/)
        .withMessage(
            "Member ID must be string started with 'm' or 'M' and followed by at least 3 digits",
        ),

    body("bookId")
        .isString()
        .matches(/^[a-zA-Z]+-\d{1,}$/)
        .withMessage(
            "Book ID must be string consisted of alphabetic characters followed by a hyphen and at least 1 digit",
        ),
]
