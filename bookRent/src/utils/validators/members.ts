import { param } from "express-validator"

export const memberIdValidator = [
    param("id")
        .isString()
        .matches(/^[M-m]\d{2,}$/)
        .withMessage(
            "Member ID must be string started with 'm' or 'M' and followed by at least 3 digits",
        ),
]
