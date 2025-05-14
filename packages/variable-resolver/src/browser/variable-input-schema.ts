import { IJSONSchema } from '@gepick/core/common';

// eslint-disable-next-line no-template-curly-in-string
const idDescription = "The input's id is used to associate an input with a variable of the form ${input:id}.";
const typeDescription = 'The type of user input prompt to use.';
const descriptionDescription = 'The description is shown when the user is prompted for input.';
const defaultDescription = 'The default value for the input.';

export const inputsSchema: IJSONSchema = {
  definitions: {
    inputs: {
      type: 'array',
      description: 'User inputs. Used for defining user input prompts, such as free string input or a choice from several options.',
      items: {
        oneOf: [
          {
            type: 'object',
            required: ['id', 'type', 'description'],
            additionalProperties: false,
            properties: {
              id: {
                type: 'string',
                description: idDescription,
              },
              type: {
                type: 'string',
                description: typeDescription,
                enum: ['promptString'],
                enumDescriptions: [
                  "The 'promptString' type opens an input box to ask the user for input.",
                ],
              },
              description: {
                type: 'string',
                description: descriptionDescription,
              },
              default: {
                type: 'string',
                description: defaultDescription,
              },
            },
          },
          {
            type: 'object',
            required: ['id', 'type', 'description', 'options'],
            additionalProperties: false,
            properties: {
              id: {
                type: 'string',
                description: idDescription,
              },
              type: {
                type: 'string',
                description: typeDescription,
                enum: ['pickString'],
                enumDescriptions: [
                  "The 'pickString' type shows a selection list.",
                ],
              },
              description: {
                type: 'string',
                description: descriptionDescription,
              },
              default: {
                type: 'string',
                description: defaultDescription,
              },
              options: {
                type: 'array',
                description: 'An array of strings that defines the options for a quick pick.',
                items: {
                  type: 'string',
                },
              },
            },
          },
          {
            type: 'object',
            required: ['id', 'type', 'command'],
            additionalProperties: false,
            properties: {
              id: {
                type: 'string',
                description: idDescription,
              },
              type: {
                type: 'string',
                description: typeDescription,
                enum: ['command'],
                enumDescriptions: [
                  "The 'command' type executes a command.",
                ],
              },
              command: {
                type: 'string',
                description: 'The command to execute for this input variable.',
              },
              args: {
                type: 'object',
                description: 'Optional arguments passed to the command.',
              },
            },
          },
        ],
      },
    },
  },
};
