import cron from "node-cron"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const schedule = cron.schedule("* * * * *", async () => {
    try {
        const membersToUpdate = await prisma.members.findMany({
            where: {
                penalty_end_date: {
                    lte: new Date(),
                },
                is_penalized: true,
            },
        })
        console.log(membersToUpdate)
        if (membersToUpdate.length) {
            await prisma.members.updateMany({
                where: {
                    penalty_end_date: {
                        lte: new Date(),
                    },
                },
                data: { is_penalized: false },
            })
            console.log("Successfully updated penalized status")
        } else {
            console.log("No members to update.")
        }
    } catch (error) {
        console.error("Error updating penalized members:", error)
    }
})

//
