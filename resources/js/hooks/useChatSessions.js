import { useState, useEffect, useRef, useCallback } from 'react';
import { chatStore } from '../lib/chatStore';

export function useChatSessions(studioId) {
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const activeSessionIdRef = useRef(null);
    const timeoutRef = useRef(null);

    // Keep ref in sync
    useEffect(() => {
        activeSessionIdRef.current = activeSessionId;
    }, [activeSessionId]);

    useEffect(() => {
        if (!studioId) return;
        
        setIsLoading(true);
        chatStore.getSessions(studioId)
            .then(({ data }) => setSessions(data || []))
            .catch(err => {
                console.error("Failed to load sessions:", err);
                setSessions([]);
            })
            .finally(() => setIsLoading(false));
    }, [studioId]);

    const performPersist = async (messages) => {
        if (!messages || messages.length === 0) return;

        const title = messages.find(m => m.role === 'user')?.content?.slice(0, 60) ?? 'New Chat';

        try {
            if (activeSessionIdRef.current === null) {
                // CREATE
                const { data } = await chatStore.createSession(studioId, { title, messages });
                setActiveSessionId(data.id);
                activeSessionIdRef.current = data.id; // update ref synchronously for subsequent debounced calls
                setSessions(prev => [data, ...prev]);
            } else {
                // UPDATE
                await chatStore.updateSession(studioId, activeSessionIdRef.current, { title, messages });
                setSessions(prev =>
                    prev.map(s => 
                        s.id === activeSessionIdRef.current 
                            ? { ...s, title, updated_at: new Date().toISOString() } 
                            : s
                    )
                );
            }
        } catch (error) {
            console.error("Failed to persist session:", error);
        }
    };

    // We store the messages inside a ref inside the useCallback so flush() can access it without being re-created
    const persistRef = useRef({ messages: [] });

    const flushPendingPersist = async () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
            await performPersist(persistRef.current.messages);
        }
    };

    const persistCurrentSession = useCallback((messages) => {
        if (messages.length === 0) return;
        
        persistRef.current.messages = messages;
        
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
            timeoutRef.current = null;
            performPersist(persistRef.current.messages);
        }, 400);
    }, [studioId]);

    const startNewSession = async (currentMessages, isRequestInFlight, setMessagesCallback) => {
        if (isRequestInFlight) return; // button is also disabled in UI — double guard
        
        if (currentMessages && currentMessages.length > 0) {
            await flushPendingPersist(); // cancel debounce, write immediately before clearing
        }
        
        if (setMessagesCallback) {
            setMessagesCallback([]);
        }
        setActiveSessionId(null); // 🔒 Fix #4 — reset BOTH, not just messages
    };

    const selectSession = async (sessionId, setMessagesCallback) => {
        try {
            const { data } = await chatStore.getSession(studioId, sessionId);
            if (setMessagesCallback) {
                setMessagesCallback(data.messages || []);
            }
            setActiveSessionId(data.id);
        } catch (error) {
            console.error("Failed to load session details:", error);
        }
    };

    const deleteSession = async (sessionId, currentMessages, setMessagesCallback) => {
        if (!confirm('Delete this chat? This cannot be undone.')) {
            return;
        }

        try {
            await chatStore.deleteSession(studioId, sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            
            if (activeSessionIdRef.current === sessionId) {
                // We're deleting the active session.
                if (currentMessages && currentMessages.length > 0) {
                    await flushPendingPersist(); // maybe flush? But we are deleting it anyway, so we just clear timeout
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                        timeoutRef.current = null;
                    }
                }
                if (setMessagesCallback) {
                    setMessagesCallback([]);
                }
                setActiveSessionId(null);
            }
        } catch (error) {
            console.error("Failed to delete session:", error);
        }
    };

    const renameSession = async (sessionId, title) => {
        try {
            await chatStore.updateSession(studioId, sessionId, { title });
            setSessions(prev =>
                prev.map(s => 
                    s.id === sessionId 
                        ? { ...s, title, updated_at: new Date().toISOString() } 
                        : s
                )
            );
        } catch (error) {
            console.error("Failed to rename session:", error);
        }
    };

    return {
        sessions,
        activeSessionId,
        isLoading,
        startNewSession,
        selectSession,
        persistCurrentSession,
        deleteSession,
        renameSession
    };
}
