import { param } from "express-validator"

export const bookIdValidator = [
    param("id")
        .isString()
        .matches(/^[a-zA-Z]+-\d{1,}$/)
        .withMessage(
            "Book ID must be string consisted of alphabetic characters followed by a hyphen and at least 1 digit",
        ),
]
