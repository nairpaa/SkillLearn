// Daftar pendek password yang paling sering dipakai/bocor (diambil dari daftar populer
// seperti SecLists & NordPass). Sudah memenuhi aturan "minimal 8 karakter + 1 angka",
// tapi tetap gampang ditebak, makanya ditolak.
const COMMON = `
12345678 123456789 1234567890 12345678910 87654321 11111111 00000000 88888888 12341234 11223344
password1 password12 password123 password1234 passw0rd p@ssw0rd p@ssword1 pa55word pass1234 password01
qwerty12 qwerty123 qwerty1234 qwertyuiop1 1qaz2wsx 1q2w3e4r 1q2w3e4r5t q1w2e3r4 zaq12wsx asdf1234
abc12345 abcd1234 abc123456 a1b2c3d4 aa123456 iloveyou1 iloveyou2 welcome1 welcome123 admin123
admin1234 administrator1 letmein1 monkey123 dragon123 master123 sunshine1 princess1 football1 baseball1
superman1 batman123 starwars1 trustno1 shadow123 michael1 jessica1 charlie1 jordan23 hello123
test1234 testing123 secret123 changeme1 default1 user1234 login123 guest1234 computer1 internet1
samsung123 google123 facebook1 instagram1 indonesia1 indonesia123 jakarta123 bandung123 surabaya1 binus123
bismillah1 sayang123 cinta123 rahasia123 katasandi1 kucing123 anjing123 doraemon1 naruto123 persija1
persib123 garuda123 merdeka45 qwe12345 zxcvbnm1 asdfghjk1 1234qwer 123qweasd qweasd123 123abc456
skilllearn1 skilllearn123 student123 mahasiswa1 kampus123 university1 college123 school123
`;

const SET = new Set(COMMON.split(/\s+/).filter(Boolean));

export function isCommonPassword(password) {
  const p = password.toLowerCase();
  // Juga tangkap variasi sederhana seperti "Password123!" atau "qwerty123?".
  return SET.has(p) || SET.has(p.replace(/[^a-z0-9]+$/, '')) || /^(.)\1+$/.test(p) || /^\d+$/.test(p);
}
