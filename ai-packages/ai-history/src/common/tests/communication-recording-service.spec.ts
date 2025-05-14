import { describe, expect, it } from "vitest";
import { TextMessage } from "@gepick/ai-core/common";
import { DefaultCommunicationRecordingService } from "../communication-recording-service";

describe('defaultCommunicationRecordingService', () => {
  it('records history', () => {
    const service = new DefaultCommunicationRecordingService();
    service.recordRequest({ agentId: 'agent', requestId: '1', sessionId: '1', timestamp: 100, request: [{ type: 'text', actor: 'user', text: 'dummy request' }] });

    const history1 = service.getHistory('agent');
    expect((history1[0].request?.[0] as TextMessage).text).to.eq('dummy request');

    service.recordResponse({ agentId: 'agent', requestId: '1', sessionId: '1', timestamp: 200, response: [{ type: 'text', actor: 'ai', text: 'dummy response' }] });
    const history2 = service.getHistory('agent');
    expect((history2[0].request?.[0] as TextMessage).text).to.eq('dummy request');
    expect((history2[0].response?.[0] as TextMessage).text).to.eq('dummy response');
  });

  it('returns session history', () => {
    const service = new DefaultCommunicationRecordingService();
    // some requests and responses for session 1
    service.recordRequest({ agentId: 'agent', requestId: '1', sessionId: '1', timestamp: 100, request: [{ type: 'text', actor: 'user', text: 'session 1 request 1' }] });
    service.recordResponse({ agentId: 'agent', requestId: '1', sessionId: '1', timestamp: 200, response: [{ type: 'text', actor: 'ai', text: 'session 1 response 1' }] });
    service.recordRequest({ agentId: 'agent2', requestId: '2', sessionId: '1', timestamp: 100, request: [{ type: 'text', actor: 'user', text: 'session 1 request 2' }] });
    service.recordResponse({ agentId: 'agent2', requestId: '2', sessionId: '1', timestamp: 200, response: [{ type: 'text', actor: 'ai', text: 'session 1 response 2' }] });
    // some requests and responses for session 2
    service.recordRequest({ agentId: 'agent', requestId: '3', sessionId: '2', timestamp: 100, request: [{ type: 'text', actor: 'user', text: 'different session request' }] });
    service.recordResponse({ agentId: 'agent', requestId: '3', sessionId: '2', timestamp: 200, response: [{ type: 'text', actor: 'ai', text: 'different session request' }] });

    const history1 = service.getSessionHistory('1');
    expect(history1.length).to.eq(2);
    expect((history1[0].request?.[0] as TextMessage).text).to.eq('session 1 request 1');
    expect((history1[0].response?.[0] as TextMessage).text).to.eq('session 1 response 1');
    expect((history1[1].request?.[0] as TextMessage).text).to.eq('session 1 request 2');
    expect((history1[1].response?.[0] as TextMessage).text).to.eq('session 1 response 2');

    const history2 = service.getSessionHistory('2');
    expect(history2.length).to.eq(1);
    expect((history2[0].request?.[0] as TextMessage).text).to.eq('different session request');
    expect((history2[0].response?.[0] as TextMessage).text).to.eq('different session request');
  });
});
