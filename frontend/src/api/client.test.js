import { describe, expect, it } from 'vitest';
import { canManageSchool, isAdmin } from './client';

describe('RBAC helpers', () => {
  it('identifies admin', () => {
    expect(isAdmin('admin')).toBe(true);
    expect(isAdmin('staff')).toBe(false);
  });

  it('identifies staff who can manage school data', () => {
    expect(canManageSchool('staff')).toBe(true);
    expect(canManageSchool('user')).toBe(false);
  });
});
