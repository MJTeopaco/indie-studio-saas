import axios from 'axios';

export const chatStore = {
    getSessions: (tenantId) =>
        axios.get(route('tenant.chats.index', { tenant: tenantId })),

    getSession: (tenantId, sessionId) =>
        axios.get(route('tenant.chats.show', { tenant: tenantId, chatSession: sessionId })),

    createSession: (tenantId, { title, messages }) =>
        axios.post(route('tenant.chats.store', { tenant: tenantId }), { title, messages }),

    updateSession: (tenantId, sessionId, { title, messages }) =>
        axios.patch(route('tenant.chats.update', { tenant: tenantId, chatSession: sessionId }), { title, messages }),

    deleteSession: (tenantId, sessionId) =>
        axios.delete(route('tenant.chats.destroy', { tenant: tenantId, chatSession: sessionId })),
};
