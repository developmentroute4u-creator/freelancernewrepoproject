# React Error #310 - Debugging Guide

## Error Message
```
Minified React error #310
```

## What This Error Means

React Error #310 occurs when **hooks are called in the wrong way**. The full error message is:
> "Rendered more hooks than during the previous render"

This happens when:
1. Hooks are called conditionally (inside `if` statements)
2. Hooks are called in loops
3. Hooks are called in nested functions
4. The number of hook calls changes between renders

---

## Common Causes in Your App

### 1. Conditional Hook Calls ❌

**WRONG**:
```typescript
if (someCondition) {
  useEffect(() => {
    // This is wrong!
  }, []);
}
```

**CORRECT**:
```typescript
useEffect(() => {
  if (someCondition) {
    // Condition inside the hook
  }
}, [someCondition]);
```

### 2. Early Returns Before Hooks ❌

**WRONG**:
```typescript
export default function Component() {
  if (!data) {
    return <div>Loading...</div>;
  }
  
  // ❌ This hook won't be called if data is null
  useEffect(() => {
    // ...
  }, []);
}
```

**CORRECT**:
```typescript
export default function Component() {
  // ✅ Call all hooks first
  useEffect(() => {
    if (data) {
      // ...
    }
  }, [data]);
  
  if (!data) {
    return <div>Loading...</div>;
  }
}
```

### 3. Server-Side Rendering Issues ❌

**WRONG**:
```typescript
useEffect(() => {
  const token = localStorage.getItem('token'); // ❌ localStorage not available on server
}, []);
```

**CORRECT**:
```typescript
useEffect(() => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token'); // ✅ Check for browser environment
  }
}, []);
```

---

## How to Debug

### Step 1: Check for Conditional Hook Calls

Search your codebase for patterns like:
```bash
# Search for conditional useEffect
grep -r "if.*useEffect" client/app/
```

### Step 2: Check for Early Returns

Look for components that return before all hooks are called:
```typescript
// BAD PATTERN
function Component() {
  if (condition) return null; // ❌ Early return
  useEffect(() => {}, []); // This won't always run
}
```

### Step 3: Enable Non-Minified Build

To see the full error message, run in development mode:
```bash
cd client
npm run dev
```

---

## Likely Culprits in Your App

Based on your codebase, check these files:

### 1. `client/app/freelancer/test/page.tsx`
- Has 2 `useEffect` calls (lines 203, 390)
- Check if there are any conditional returns before these hooks

### 2. `client/app/freelancer/dashboard/page.tsx`
- Has `useEffect` on line 18
- Check the early return on line 190-192:
  ```typescript
  if (!freelancer) {
    return <div>Loading...</div>; // ❌ This might be the issue
  }
  ```

### 3. `client/app/client/projects/create/page.tsx`
- Uses `Suspense` which can cause hydration issues

---

## Quick Fixes

### Fix 1: Move Early Returns After All Hooks

**Before**:
```typescript
export default function FreelancerDashboard() {
  const [freelancer, setFreelancer] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  
  useEffect(() => {
    loadData();
  }, []);
  
  if (!freelancer) {
    return <div>Loading...</div>; // ❌ Problem: useEffect already called
  }
  
  // More code...
}
```

**After**:
```typescript
export default function FreelancerDashboard() {
  const [freelancer, setFreelancer] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);
  
  // ✅ Return loading state without early return
  if (loading || !freelancer) {
    return <div>Loading...</div>;
  }
  
  // More code...
}
```

### Fix 2: Add Loading State

Instead of checking `if (!data)`, use a proper loading state:

```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      const result = await api.get('/endpoint');
      setData(result.data);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);

if (loading) return <div>Loading...</div>;
```

### Fix 3: Use Optional Chaining

Instead of early returns, use optional chaining:

```typescript
// Instead of:
if (!freelancer) return <div>Loading...</div>;

// Use:
return (
  <div>
    {!freelancer ? (
      <div>Loading...</div>
    ) : (
      // Your component JSX
    )}
  </div>
);
```

---

## Specific File Fixes

### `client/app/freelancer/dashboard/page.tsx`

**Current Code (Lines 190-192)**:
```typescript
if (!freelancer) {
  return <div>Loading...</div>;
}
```

**Fix**:
```typescript
// Remove the early return and use conditional rendering instead
return (
  <div className="container mx-auto py-8">
    {!freelancer ? (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    ) : (
      <>
        {/* Rest of your component */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Freelancer Dashboard</h1>
          <LogoutButton />
        </div>
        {/* ... rest of the JSX ... */}
      </>
    )}
  </div>
);
```

---

## Testing the Fix

1. **Clear browser cache and localStorage**:
   ```javascript
   // In browser console
   localStorage.clear();
   location.reload();
   ```

2. **Restart development server**:
   ```bash
   cd client
   npm run dev
   ```

3. **Check browser console** for the error

4. **If error persists**, run production build to see minified errors:
   ```bash
   npm run build
   npm run start
   ```

---

## Prevention Checklist

✅ **Always call hooks at the top level** of your component
✅ **Never call hooks conditionally** (no `if (condition) useEffect(...)`)
✅ **Never call hooks in loops** (no `for` or `while` with hooks)
✅ **Use loading states** instead of early returns
✅ **Check for `window` or `localStorage`** before using in `useEffect`
✅ **Keep hook calls in the same order** on every render

---

## Additional Resources

- [React Hooks Rules](https://react.dev/reference/rules/rules-of-hooks)
- [React Error #310 Details](https://react.dev/errors/310)
- [Next.js SSR Best Practices](https://nextjs.org/docs/messages/react-hydration-error)
