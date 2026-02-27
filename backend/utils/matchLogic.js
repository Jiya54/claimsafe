function calculateConfidence(hiddenDetail, userInput) {
  const hiddenWords = hiddenDetail.toLowerCase().split(" ");
  const userWords = userInput.toLowerCase().split(" ");

  let matchCount = 0;

  hiddenWords.forEach(word => {
    if (userWords.includes(word)) {
      matchCount++;
    }
  });

  const confidence = (matchCount / hiddenWords.length) * 100;
  return Math.round(confidence);
}

module.exports = calculateConfidence;