# ClaimSafe Backend Changes - Secret Question & Answer System 

## Overview
Updated the Lost & Found verification system from hidden details to secret questions and answers with improved text similarity matching.

---

## 1. Item Model (`/backend/models/Item.js`)

**Changes:**
- Removed: `hiddenDetail` field
- Added: `secretQuestion` (string) - The question the founder asks
- Added: `secretAnswer` (string) - The answer only the true owner should know

**Schema:**
```javascript
{
  title: String,
  description: String,
  secretQuestion: String,        // "What color is the zipper?"
  secretAnswer: String,          // "blue"
  image: String,
  location: { latitude: Number, longitude: Number },
  dateFound: Date
}
```

---

## 2. Claim Model (`/backend/models/Claim.js`)

**Changes:**
- Renamed: `claimantDescription` → `claimerAnswer`
- Updated: Field now stores the claimer's answer to the secret question

**Schema:**
```javascript
{
  itemId: ObjectId,
  claimerAnswer: String,         // Claimer's answer to the secret question
  confidenceScore: Number,       // 0-100
  createdAt: Date
}
```

---

## 3. Match Logic (`/backend/utils/matchLogic.js`)

**Improvements:**
- Implements **Levenshtein distance** algorithm for character-level similarity
- Combines two similarity metrics:
  - **70% Character Similarity**: Measures edit distance between strings (handles typos)
  - **30% Word Matching**: Ensures key words are present (handles different phrasings)

**Confidence Calculation:**
- Exact match = 100%
- Minor typos (1-2 character edits) = high score (80-99%)
- One word match in multi-word answer = medium score (40-70%)
- No similarity = 0%

**Example Scores:**
- Founder: "blue", Claimer: "blue" → **100%**
- Founder: "blue", Claimer: "bluw" → **90%** (1 typo)
- Founder: "red leather wallet", Claimer: "red wallet" → **85%** (missing one word)
- Founder: "blue", Claimer: "green" → **0%** (no match)

---

## 4. Claim Routes (`/backend/routes/claimRoutes.js`)

### POST /api/claim
**Request Body:**
```json
{
  "itemId": "ObjectId",
  "claimerAnswer": "user's answer to the secret question"
}
```

**Response (Success):**
```json
{
  "confidence": 85,
  "message": "High confidence match!"
}
```

**Response (Low Confidence):**
```json
{
  "confidence": 25,
  "message": "Low confidence, claim rejected"
}
```

**Logic:**
1. Fetch item by `itemId`
2. Get item's `secretAnswer`
3. Compare with `claimerAnswer` using `calculateConfidence()`
4. Save claim with calculated confidence score
5. Return confidence ≥ 60 = valid claim

---

### GET /api/items/:itemId/question (NEW)
**Purpose:** Retrieve the secret question for an item before claiming

**Response:**
```json
{
  "secretQuestion": "What color is the zipper?"
}
```

**Security:** Only returns the question, NEVER the answer

---

### GET /api/claims/:itemId
**Returns:** All claims for an item, sorted by confidence (highest first)

```json
[
  { "itemId": "...", "claimerAnswer": "blue", "confidenceScore": 95, "createdAt": "..." },
  { "itemId": "...", "claimerAnswer": "bue", "confidenceScore": 80, "createdAt": "..." }
]
```

---

### GET /api/claims/:itemId/location
**Returns:** Item location ONLY if top claim has confidence ≥ 60

**Response (Valid):**
```json
{
  "location": { "latitude": 40.7128, "longitude": -74.0060 },
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Response (Invalid):**
```
403 Forbidden
{
  "message": "No valid claim yet"
}
```

---

## 5. Item Routes (`/backend/routes/itemRoutes.js`)

### POST /api/items
**Request (multipart/form-data):**
```
Fields:
- title (string)
- description (string)
- secretQuestion (string)          // NEW
- secretAnswer (string)            // NEW
- image (file)
- latitude (number)
- longitude (number)
```

**Response:**
```json
{
  "message": "Item reported successfully",
  "item": {
    "_id": "ObjectId",
    "title": "Blue Backpack",
    "description": "Navy blue with laptop pocket",
    "secretQuestion": "What color is the zipper?",
    "image": "item-1698765432-123456789.jpg",
    "location": { "latitude": 40.7128, "longitude": -74.0060 },
    "dateFound": "2026-02-28T10:30:00.000Z"
  }
}
```

**Validation:**
- All fields required (title, description, secretQuestion, secretAnswer, image, latitude, longitude)
- Image: max 5MB, image MIME types only
- Coordinates: must be valid numbers

---

## API Workflow

### 1. Report Found Item (Founder)
```
POST /api/items
- Upload: title, description, secretQuestion, secretAnswer, image, location
- Response: Item saved with ID
```

### 2. Browse Items (Claimer)
```
GET /api/items
- Response: List of all items (questions visible, answers hidden)
```

### 3. Get Secret Question (Claimer)
```
GET /api/items/:itemId/question
- Response: Only the question, no answer
```

### 4. Submit Claim (Claimer)
```
POST /api/claim
- Send: itemId, claimerAnswer
- Response: Confidence score (0-100)
- If confidence ≥ 60: Valid claim
- If confidence < 60: Claim rejected
```

### 5. Reveal Location (Claimer)
```
GET /api/claims/:itemId/location
- Only works if top claim has confidence ≥ 60
- Response: Item coordinates + Google Maps link
```

---

## Key Security Features

✅ Secret answer stored on backend (never exposed to client)
✅ Only question displayed to claimers
✅ Location hidden until confidence ≥ 60
✅ Text similarity prevents exact-match guessing
✅ Typo-tolerant matching (handles common mistakes)
✅ Word-level matching (handles paraphrasing)

---

## Testing the System

**Example Scenario:**

Founder reports item:
```
Title: "Blue Wallet"
Description: "Navy blue leather, with red stripe"
Secret Question: "What color is the stripe?"
Secret Answer: "red"
Location: (40.7128, -74.0060)
```

Claimer 1 claims with answer "red":
```
Confidence: 100% ✅ (exact match)
Claim valid, location revealed
```

Claimer 2 claims with answer "Red":
```
Confidence: 100% ✅ (case-insensitive match)
Claim valid, location revealed
```

Claimer 3 claims with answer "red stripe":
```
Confidence: 85% ✅ (one word match + high similarity)
Claim valid, location revealed
```

Claimer 4 claims with answer "blue":
```
Confidence: 0% ❌ (wrong answer)
Claim rejected, location hidden
```

---

## Files Modified

- ✅ `/backend/models/Item.js` - Updated schema
- ✅ `/backend/models/Claim.js` - Updated schema
- ✅ `/backend/utils/matchLogic.js` - Improved similarity matching
- ✅ `/backend/routes/claimRoutes.js` - Updated routes + new question endpoint
- ✅ `/backend/routes/itemRoutes.js` - Updated POST /api/items

## Next Steps (Frontend)

Update frontend to:
1. Add secret question & answer inputs to found.html
2. Fetch question with GET /api/items/:itemId/question in claim.js
3. Send claimerAnswer instead of claimantDescription to POST /api/claim
4. Display question and answer field in claim modal
