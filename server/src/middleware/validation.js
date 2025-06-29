import { body, param, query, validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation error',
      details: errors.array().map(err => err.msg)
    });
  }
  next();
};

// Auth validation rules
export const signupValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  body('fullName').isLength({ min: 2 }).trim(),
  body('organization').optional().trim()
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Agent validation rules
export const agentValidation = [
  body('name').isLength({ min: 1, max: 100 }).trim(),
  body('identity').isLength({ min: 1, max: 500 }).trim(),
  body('voice').isIn(['sarah', 'alex', 'emma', 'james']),
  body('systemPrompt').optional().isLength({ max: 2000 }),
  body('introPrompt').optional().isLength({ max: 1000 }),
  body('fallbackPrompt').optional().isLength({ max: 1000 }),
  body('githubDeploy').optional().isBoolean(),
  body('repo').optional().trim()
];

// Knowledge base validation rules
export const knowledgeBaseValidation = [
  body('name').isLength({ min: 1, max: 100 }).trim(),
  body('description').isLength({ min: 1, max: 500 }).trim(),
  body('category').isIn(['product', 'support', 'training']),
  body('initialSources').optional().isArray()
];

// Metrics validation rules
export const metricsValidation = [
  body('name').isLength({ min: 1, max: 100 }).trim(),
  body('toolCall').isLength({ min: 1, max: 100 }).trim(),
  body('description').isLength({ min: 1, max: 500 }).trim()
];

// API key validation rules
export const apiKeyValidation = [
  body('service').isLength({ min: 1, max: 50 }).trim(),
  body('key').isLength({ min: 1, max: 500 }).trim(),
  body('description').optional().isLength({ max: 200 }).trim()
];

// UUID validation
export const uuidValidation = [
  param('id').isUUID()
];