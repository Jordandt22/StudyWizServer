const Joi = require("joi");

// Privacy
const PrivacySchema = Joi.object().keys({
  hideCreator: Joi.boolean().required(),
  private: Joi.boolean().required(),
});

// Term
const TermSchema = Joi.object().keys({
  term: Joi.string().trim().min(1).max(100).required().messages({
    "any.required": "A term is required.",
    "string.empty": "A term is required.",
    "string.min": "Term must be between 1-100 characters.",
    "string.max": "Term must be between 1-100 characters.",
  }),
  definition: Joi.string().trim().min(1).max(1000).required().messages({
    "any.required": "A definition is required.",
    "string.empty": "A definition is required.",
    "string.min": "Definition must be between 1-1000 characters.",
    "string.max": "Definition must be between 1-1000 characters.",
  }),
});

// Set
const SetSchema = Joi.object()
  .keys({
    title: Joi.string().trim().min(1).max(100).required().messages({
      "any.required": "Must enter a title for your voacb set.",
      "string.empty": "Must enter a title for your voacb set.",
      "string.min": "Must enter a title for your voacb set.",
      "string.max": "Your title must be less than 100 characters.",
    }),
    privacy: PrivacySchema,
    terms: Joi.array().min(1).max(50).items(TermSchema).required(),
  })
  .options({ abortEarly: false });

// Set ID
const SetIdSchema = Joi.object().keys({
  setId: Joi.string().trim().min(1).max(500).required(),
});

// Multiple Sets
const MultipleSetsSchema = Joi.object()
  .keys({
    sets: Joi.array().min(1).max(20).items(SetIdSchema).required(),
  })
  .options({ abortEarly: false });

// Community Search
const CommunitySearchSchema = Joi.object()
  .keys({
    filter: Joi.string().min(1).max(50).required(),
    ownedBy: Joi.string().min(1).max(50).required(),
  })
  .options({ abortEarly: false });

module.exports = {
  validator: (schema) => async (req, res, next) => {
    const result = schema.validate(req.body);
    const error = result.error;
    if (error) {
      let errors = {};
      error.details.map((e) => {
        const {
          path,
          context: { label },
          message,
        } = e;
        if (path.length === 1) {
          return (errors[label] = message);
        } else {
          const arrayName = path[0];
          if (!errors[arrayName]) errors[arrayName] = [];

          // Adding the Key &&  Error Message to array
          const index = path[1];
          const key = path[2];
          if (index === 0) {
            errors[arrayName] = [{ [key]: message }];
          } else {
            const previousValue = errors[arrayName][index]
              ? errors[arrayName][index]
              : null;
            errors[arrayName][index] = previousValue
              ? {
                  ...previousValue,
                  [key]: message,
                }
              : { [key]: message };
          }
        }
      });
      return res.status(422).json({ errors });
    }

    next();
  },
  schemas: { SetSchema, MultipleSetsSchema, CommunitySearchSchema },
};
