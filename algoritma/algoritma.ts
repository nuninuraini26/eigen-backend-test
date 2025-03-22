//1. Terdapat string "NEGIE1", silahkan reverse alphabet nya dengan angka tetap diakhir kata Hasil = "EIGEN1"
export function reverseString(str: string) {
    const lastDgt = str.slice(-1)
    const strArr = str.slice(0, str.length - 1).split("")
    const reverseArr = strArr.reverse()
    reverseArr.push(lastDgt)
    const reversedStr = reverseArr.join("")
    return reversedStr
}

//2. Diberikan contoh sebuah kalimat, silahkan cari kata terpanjang dari kalimat tersebut, jika ada kata dengan panjang yang sama silahkan ambil salah satu
export function longestWord(str: string) {
    const wordObj = str.split(" ").map((s) => {
        return {
            word: s,
            length: s.length,
        }
    })
    const maxLength = Math.max(...wordObj.map((w) => w.length))
    const longestWord = wordObj.find((w) => w.length === maxLength)
    return `${longestWord?.word}: ${longestWord?.length} characters`
}

//3. Terdapat dua buah array yaitu array INPUT dan array QUERY, silahkan tentukan berapa kali kata dalam QUERY terdapat pada array INPUT

export function queryWords(input: string[], query: string[]) {
    const output = query.map((q) => {
        const result = input.filter((i) => i === q)
        return result.length
    })
    return output
}

//4. Silahkan cari hasil dari pengurangan dari jumlah diagonal sebuah matrik NxN Contoh:
export function diagonalReduction(mtx: any[][]) {
    const rightDiagonalSum = mtx
        .map((row, rowIndex) => {
            return row[rowIndex]
        })
        .reduce((acc, val) => {
            return acc + val
        }, 0)

    const leftDiagonalSum = mtx
        .map((row, rowIndex) => {
            return row[mtx.length - 1 - rowIndex]
        })
        .reduce((acc, val) => {
            return acc + val
        }, 0)
    return rightDiagonalSum - leftDiagonalSum
}
