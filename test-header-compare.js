// Compare headers
const correct = 'K91609289002511100001025111091609289000000קהילת חניכי כנסת יצחק                                                                 KOT'
const software = 'K91609289002511110001025111191609000000קהילת חניכי כנסת יצחק                                                                 KOT'

console.log('=== CORRECT FILE ===')
console.log('Pos 1:', correct.substring(0, 1))
console.log('Pos 2-9:', correct.substring(1, 9))
console.log('Pos 10-11:', correct.substring(9, 11))
console.log('Pos 12-17:', correct.substring(11, 17))
console.log('Pos 18:', correct.substring(17, 18))
console.log('Pos 19-21:', correct.substring(18, 21))
console.log('Pos 22:', correct.substring(21, 22))
console.log('Pos 23-28:', correct.substring(22, 28))
console.log('Pos 29-33:', correct.substring(28, 33))
console.log('Pos 34-39:', correct.substring(33, 39))
console.log('Pos 40-69:', correct.substring(39, 69))

console.log('\n=== SOFTWARE FILE ===')
console.log('Pos 1:', software.substring(0, 1))
console.log('Pos 2-9:', software.substring(1, 9))
console.log('Pos 10-11:', software.substring(9, 11))
console.log('Pos 12-17:', software.substring(11, 17))
console.log('Pos 18:', software.substring(17, 18))
console.log('Pos 19-21:', software.substring(18, 21))
console.log('Pos 22:', software.substring(21, 22))
console.log('Pos 23-28:', software.substring(22, 28))
console.log('Pos 29-33:', software.substring(28, 33))
console.log('Pos 34-39:', software.substring(33, 39))
console.log('Pos 40-69:', software.substring(39, 69))
