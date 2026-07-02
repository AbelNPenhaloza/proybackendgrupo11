// 2MB reales ≈ 2.796.202 caracteres en base64 (base64 agrega ~33% de overhead:
// 2 * 1024 * 1024 bytes * 4/3 ≈ 2.796.202)
const MAX_BASE64_LENGTH = 2_796_202;

module.exports = { MAX_BASE64_LENGTH };