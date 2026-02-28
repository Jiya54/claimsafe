const stringSimilarity = require('string-similarity');

/**
 * Calculate text similarity between two strings using fuzzy matching.
 * Returns a confidence score from 0-100.
 * 
 * Handles variations like:
 * - "pen" vs "blue pen" → ~90%+ (substring present)
 * - "red" vs "red wallet" → ~85%+ (partial match)
 * - "blue" vs "bluw" → ~80%+ (typos)
 * - "blue" vs "blue" → 100% (exact match)
 * 
 * @param {string} hiddenDetail - The correct answer (from founder)
 * @param {string} userInput - The claimer's answer
 * @returns {number} Confidence score (0-100)
 */
function calculateConfidence(hiddenDetail, userInput) {
  // Validate inputs
  if (!hiddenDetail || !userInput || typeof hiddenDetail !== 'string' || typeof userInput !== 'string') {
    return 0;
  }

  const correct = hiddenDetail.toLowerCase().trim();
  const claimer = userInput.toLowerCase().trim();

  // Exact match = 100% confidence
  if (correct === claimer) {
    return 100;
  }

  // Use string-similarity for fuzzy matching
  let similarityScore = stringSimilarity.compareTwoStrings(correct, claimer);

  // Check if the correct answer is a substring of the claimer's answer
  // This gives high confidence even with additions
  if (claimer.includes(correct)) {
    similarityScore = Math.max(similarityScore, 0.92);
  }

  // Check if the correct answer contains significant portions of claimer's answer
  if (correct.includes(claimer) && claimer.length > 2) {
    similarityScore = Math.max(similarityScore, 0.88);
  }

  // Convert to percentage and round
  const confidence = Math.round(similarityScore * 100);
  return Math.max(0, Math.min(100, confidence));
}

module.exports = calculateConfidence;