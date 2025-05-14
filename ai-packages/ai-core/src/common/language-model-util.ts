import {
  LanguageModelResponse,
  ToolRequest,
  isLanguageModelParsedResponse,
  isLanguageModelStreamResponse,
  isLanguageModelTextResponse,
  isTextResponsePart,
} from './language-model/language-model-contribution';

/**
 * Retrieves the text content from a `LanguageModelResponse` object.
 *
 * **Important:** For stream responses, the stream can only be consumed once. Calling this function multiple times on the same stream response will return an empty string (`''`)
 * on subsequent calls, as the stream will have already been consumed.
 *
 * @param {LanguageModelResponse} response - The response object, which may contain a text, stream, or parsed response.
 * @returns {Promise<string>} - A promise that resolves to the text content of the response.
 * @throws {Error} - Throws an error if the response type is not supported or does not contain valid text content.
 */
export const getTextOfResponse = async (response: LanguageModelResponse): Promise<string> => {
  if (isLanguageModelTextResponse(response)) {
    return response.text;
  }
  else if (isLanguageModelStreamResponse(response)) {
    let result = '';
    for await (const chunk of response.stream) {
      result += (isTextResponsePart(chunk) && chunk.content) ? chunk.content : '';
    }
    return result;
  }
  else if (isLanguageModelParsedResponse(response)) {
    return response.content;
  }
  throw new Error(`Invalid response type ${response}`);
};

export const getJsonOfResponse = async (response: LanguageModelResponse): Promise<unknown> => {
  const text = await getTextOfResponse(response);
  return getJsonOfText(text);
};

export const getJsonOfText = (text: string): unknown => {
  if (text.startsWith('```json')) {
    const regex = /```json\s*([\s\S]*?)\s*```/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      try {
        return JSON.parse(match[1]);
      }
      catch (error) {
        console.error('Failed to parse JSON:', error);
      }
    }
  }
  else if (text.startsWith('{') || text.startsWith('[')) {
    return JSON.parse(text);
  }
  throw new Error('Invalid response format');
};

export const toolRequestToPromptText = (toolRequest: ToolRequest): string => `${toolRequest.id}`;
