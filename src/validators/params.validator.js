const Joi = require("joi");

// Firebase ID
const FirebaseIDSchema = Joi.object()
  .keys({
    fbId: Joi.string().trim().min(1).max(500).required(),
    setId: Joi.string().trim().min(1).max(500),
  })
  .options({ abortEarly: false });

// Set ID
const SetIdSchema = Joi.object()
  .keys({
    setId: Joi.string().trim().min(1).max(500).required(),
  })
  .options({ abortEarly: false });

// Community Sets
const CommunitySetsSchema = Joi.object()
  .keys({
    filter: Joi.string().min(1).max(50).required(),
    page: Joi.number().min(1).max(10).required(),
    limit: Joi.number().min(1).max(20).required(),
  })
  .options({ abortEarly: false });

// Community Search
const CommunitySearchSchema = Joi.object()
  .keys({
    page: Joi.number().min(1).max(10).required(),
    limit: Joi.number().min(1).max(20).required(),
    query: Joi.string().min(1).max(100).required(),
  })
  .options({ abortEarly: false });

module.exports = {
  validator: (schema) => async (req, res, next) => {
    const result = schema.validate(req.params);
    const error = result.error;
    if (error) {
      let errors = {};
      error.details.map((e) => (errors[e.context.label] = e.message));
      return res.status(422).json({ errors });
    }

    next();
  },
  schemas: {
    FirebaseIDSchema,
    SetIdSchema,
    CommunitySetsSchema,
    CommunitySearchSchema,
  },
};
