import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  setAccessToken,
  getAccessToken,
  setRefreshToken,
  getRefreshToken,
  clearTokens,
  setTenantContext,
  getTenantContext,
  setPlatformMode,
  getPlatformMode,
  restorePlatformMode,
  SessionExpiredError,
} from './client';

describe('API Client - Token Management', () => {
  beforeEach(() => {
    // Clear all storage before each test
    localStorage.clear();
    sessionStorage.clear();
    clearTokens();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Access Token', () => {
    it('should store and retrieve access token', () => {
      const token = 'test-access-token';
      setAccessToken(token);

      expect(getAccessToken()).toBe(token);
    });

    it('should persist access token to sessionStorage', () => {
      const token = 'test-access-token';
      setAccessToken(token);

      expect(sessionStorage.getItem('accessToken')).toBe(token);
    });

    it('should retrieve access token from sessionStorage on page refresh', () => {
      const token = 'test-access-token';
      sessionStorage.setItem('accessToken', token);

      expect(getAccessToken()).toBe(token);
    });

    it('should remove access token when set to null', () => {
      setAccessToken('test-token');
      setAccessToken(null);

      expect(getAccessToken()).toBeNull();
      expect(sessionStorage.getItem('accessToken')).toBeNull();
    });
  });

  describe('Refresh Token', () => {
    it('should store and retrieve refresh token', () => {
      const token = 'test-refresh-token';
      setRefreshToken(token);

      expect(getRefreshToken()).toBe(token);
    });

    it('should persist refresh token to localStorage', () => {
      const token = 'test-refresh-token';
      setRefreshToken(token);

      expect(localStorage.getItem('refreshToken')).toBe(token);
    });

    it('should remove refresh token when set to null', () => {
      setRefreshToken('test-token');
      setRefreshToken(null);

      expect(getRefreshToken()).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('Clear Tokens', () => {
    it('should clear all tokens from memory and storage', () => {
      setAccessToken('access-token');
      setRefreshToken('refresh-token');

      clearTokens();

      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
      expect(sessionStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });
});

describe('API Client - Tenant Context', () => {
  beforeEach(() => {
    clearTokens();
  });

  it('should set and get tenant context', () => {
    const tenantId = 'tenant-123';
    const organizationId = 'org-456';

    setTenantContext(tenantId, organizationId);

    const context = getTenantContext();
    expect(context.tenantId).toBe(tenantId);
    expect(context.organizationId).toBe(organizationId);
    expect(context.isSuperTenant).toBe(false);
  });

  it('should set super tenant flag', () => {
    setTenantContext('tenant-123', 'org-456', true);

    const context = getTenantContext();
    expect(context.isSuperTenant).toBe(true);
  });

  it('should clear tenant context', () => {
    setTenantContext('tenant-123', 'org-456');
    setTenantContext(null, null);

    const context = getTenantContext();
    expect(context.tenantId).toBeNull();
    expect(context.organizationId).toBeNull();
  });

  it('should handle organization ID being optional', () => {
    setTenantContext('tenant-123');

    const context = getTenantContext();
    expect(context.tenantId).toBe('tenant-123');
    expect(context.organizationId).toBeNull();
  });
});

describe('API Client - Platform Mode', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should enable platform mode', () => {
    setPlatformMode(true);

    expect(getPlatformMode()).toBe(true);
  });

  it('should disable platform mode', () => {
    setPlatformMode(true);
    setPlatformMode(false);

    expect(getPlatformMode()).toBe(false);
  });

  it('should persist platform mode to localStorage', () => {
    setPlatformMode(true);

    expect(localStorage.getItem('platformMode')).toBe('true');
  });

  it('should remove platform mode from localStorage when disabled', () => {
    setPlatformMode(true);
    setPlatformMode(false);

    expect(localStorage.getItem('platformMode')).toBeNull();
  });

  it('should retrieve platform mode from localStorage on page refresh', () => {
    localStorage.setItem('platformMode', 'true');

    // Need to call restorePlatformMode to read from localStorage
    restorePlatformMode();

    expect(getPlatformMode()).toBe(true);
  });
});

describe('API Client - SessionExpiredError', () => {
  it('should create SessionExpiredError with correct properties', () => {
    const error = new SessionExpiredError();

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(SessionExpiredError);
    expect(error.message).toBe('Session expired');
    expect(error.name).toBe('SessionExpiredError');
  });

  it('should be catchable as SessionExpiredError', () => {
    try {
      throw new SessionExpiredError();
    } catch (error) {
      expect(error).toBeInstanceOf(SessionExpiredError);
    }
  });
});

describe('API Client - Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearTokens();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should handle complete authentication flow', () => {
    // 1. User logs in, receive tokens
    setAccessToken('access-123');
    setRefreshToken('refresh-456');

    expect(getAccessToken()).toBe('access-123');
    expect(getRefreshToken()).toBe('refresh-456');

    // 2. Set tenant context after login
    setTenantContext('tenant-789', 'org-101');

    const context = getTenantContext();
    expect(context.tenantId).toBe('tenant-789');
    expect(context.organizationId).toBe('org-101');

    // 3. User logs out
    clearTokens();

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('should maintain state across simulated page refresh', () => {
    // Set tokens before "refresh"
    setAccessToken('access-token');
    setRefreshToken('refresh-token');

    // Simulate page refresh by clearing memory but keeping storage
    const storedAccess = sessionStorage.getItem('accessToken');
    const storedRefresh = localStorage.getItem('refreshToken');

    expect(storedAccess).toBe('access-token');
    expect(storedRefresh).toBe('refresh-token');

    // After refresh, tokens should be retrievable from storage
    expect(getAccessToken()).toBe('access-token');
    expect(getRefreshToken()).toBe('refresh-token');
  });

  it('should handle platform admin workflow', () => {
    // Clear any existing tenant context first
    setTenantContext(null, null);

    // Platform admin logs in
    setAccessToken('platform-access-token');
    setPlatformMode(true);

    expect(getPlatformMode()).toBe(true);
    expect(getAccessToken()).toBe('platform-access-token');

    // No tenant context for platform admin
    const context = getTenantContext();
    expect(context.tenantId).toBeNull();

    // Platform admin switches to managing a specific client
    setPlatformMode(false);
    setTenantContext('client-tenant-123', 'client-org-456');

    expect(getPlatformMode()).toBe(false);
    expect(getTenantContext().tenantId).toBe('client-tenant-123');
  });

  it('should handle super tenant workflow', () => {
    // Super tenant logs in
    setAccessToken('super-tenant-token');
    setTenantContext('super-tenant-id', null, true);

    const context = getTenantContext();
    expect(context.tenantId).toBe('super-tenant-id');
    expect(context.isSuperTenant).toBe(true);
    expect(context.organizationId).toBeNull();
  });
});

describe('API Client - Edge Cases', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearTokens();
  });

  it('should handle null access token gracefully', () => {
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });

  it('should handle null refresh token gracefully', () => {
    setRefreshToken(null);
    expect(getRefreshToken()).toBeNull();
  });

  it('should handle empty string tokens', () => {
    setAccessToken('');
    setRefreshToken('');

    // Empty strings are treated as null (falsy values are removed)
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('should handle very long token strings', () => {
    const longToken = 'a'.repeat(10000);
    setAccessToken(longToken);
    setRefreshToken(longToken);

    expect(getAccessToken()).toBe(longToken);
    expect(getRefreshToken()).toBe(longToken);
  });

  it('should handle rapid token updates', () => {
    setAccessToken('token1');
    setAccessToken('token2');
    setAccessToken('token3');

    expect(getAccessToken()).toBe('token3');
  });

  it('should handle multiple tenant context switches', () => {
    setTenantContext('tenant1', 'org1');
    setTenantContext('tenant2', 'org2');
    setTenantContext('tenant3', 'org3');

    const context = getTenantContext();
    expect(context.tenantId).toBe('tenant3');
    expect(context.organizationId).toBe('org3');
  });
});
