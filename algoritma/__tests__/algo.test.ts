import {
    reverseString,
    longestWord,
    queryWords,
    diagonalReduction,
} from "../algoritma"

describe("Testing algorithms", () => {
    test("mengembalikan nilai hasil membalik urutan huruf pada kata dengan angka tetap di akhir kata", () => {
        const input = "NEGIE1"
        const expected = "EIGEN1"
        expect(reverseString(input)).toBe(expected)
    })

    test("mengembalikan kata terpanjang pada kalimat beserta jumlah karakternya", () => {
        const input = "Saya sangat senang mengerjakan soal algoritma"
        const expected = "mengerjakan: 11 characters"
        expect(longestWord(input)).toBe(expected)
    })

    test("mengembalikan output array dari banyaknya kata yang muncul pada input dari setiap anggota query", () => {
        const input = ["xc", "dz", "bbb", "dz"]
        const query = ["bbb", "ac", "dz"]
        const expected = [1, 0, 2]
        expect(queryWords(input, query)).toStrictEqual(expected)
    })

    test("mengembalikan nilai berupa hasil pengurangan dari penjumlahan anggota diagonal kanan dan kiri", () => {
        const input = [
            [1, 2, 0],
            [4, 5, 6],
            [7, 8, 9],
        ]
        const expected = 3
        expect(diagonalReduction(input)).toBe(expected)
    })
})
