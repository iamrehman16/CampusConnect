# CampusConnect Backlog - Audit Summary

**Summary:** 12 BREAKS, 34 SMELL, 22 NICE-TO-HAVE (Estimated based on audit findings).

## Critical Issues (Context)

### 1. Synchronous setState in AuthProvider
- **File:** `CampusConnect-Client/src/app/providers/AuthProvider.tsx:83`
- **Context:**
```typescript
  useEffect(() => {
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      fetchProfile().finally(() => setIsLoading(false)); // <- Issue here
    } else {
      setIsLoading(false);
    }
  }, [fetchProfile]);
```

### 2. Ref Access during Render in ChatInput
- **File:** `CampusConnect-Client/src/features/ai-chat/components/ChatInput.tsx:32`
- **Context:**
```typescript
  if (prefillValue !== undefined && prefillValue !== value) {
    setValue(prefillValue);
    onPrefillConsumed?.();
    setTimeout(() => textareaRef.current?.focus(), 0); // <- Issue here
  }
```

### 3. Floating Promises (Examples in ai/chat)
- **Files:** Many (e.g., `src/main.ts`, `src/modules/ai/services/ai-chat.service.ts`)
- **Context:** Functions return promises that are not awaited or caught. Example in `ai-chat.service.ts`:
```typescript
  // Missing await or .catch handler
  await this.conversationService.appendMessages(...); // often called without explicit promise handling in some flow paths
```

---

## BREAKS (Crashes, Silent Failures)

### Module: Auth
- `AuthProvider.tsx`: Synchronous setState in useEffect (Cascading renders).
- `ChatSocketProvider.tsx`: Synchronous setState in useEffect.

### Module: AI Chat
- `ChatInput.tsx`: Ref access during render.
- `useStreamMessage.ts`: Floating promises in streaming flow.

### Module: Chat
- `chat.gateway.ts`: Floating promises in socket event handlers.

## SMELL (Fragile Code)

### Module: AI
- Widespread `any` typing in `retrieval.service.ts`, `embedding.service.ts`.

### Module: Resource
- `resource.service.ts`: Unsafe member access on `any` results from DB queries.

## FEATURE

- Wire chat error events to optimistic message rollback by clientId — currently shows generic toast only, doesn't reconcile the specific failed message in the UI.

