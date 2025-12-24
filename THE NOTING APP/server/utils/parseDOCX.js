const mammoth = require('mammoth');

module.exports = async function parseDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
};
