/**
 * Quick Reply Action Constants
 * 
 * These constants define the supported Quick Reply actions for the conversation flow.
 * They are used to structure the conversation logic without relying on text parsing.
 */

const QUICK_REPLY_ACTIONS = {
  CONFIRM_RESOLVED: 'CONFIRM_RESOLVED',
  NEW_QUESTION: 'NEW_QUESTION',
  ESCALATE_TO_HUMAN: 'ESCALATE_TO_HUMAN',
  RETRY_AI: 'RETRY_AI',
  NEED_MORE_HELP: 'NEED_MORE_HELP',
  YES_ANOTHER_QUESTION: 'YES_ANOTHER_QUESTION',
  NO_ALL_DONE: 'NO_ALL_DONE'
};

/**
 * Resolution Type Constants
 * 
 * These constants define how a conversation was resolved.
 */

const RESOLUTION_TYPES = {
  CLIENT_CONFIRMED_AI: 'client_confirmed_ai',
  CLIENT_CONFIRMED_AGENT: 'client_confirmed_agent',
  AGENT_RESOLVED: 'agent_resolved',
  ABANDONED: 'abandoned'
};

module.exports = {
  QUICK_REPLY_ACTIONS,
  RESOLUTION_TYPES
};
