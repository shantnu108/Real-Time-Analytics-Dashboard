const Joi = require('joi');

const eventSchema = Joi.object({
  eventId: Joi.string().required(),
  timestamp: Joi.date().required(),
  userId: Joi.string().optional(),
  sessionId: Joi.string().required(),
  route: Joi.string().required(),
  action: Joi.string().required(),
  metadata: Joi.object().optional()
});

module.exports = { eventSchema };
