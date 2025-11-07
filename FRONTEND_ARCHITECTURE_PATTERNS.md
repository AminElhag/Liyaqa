# Frontend Architecture Patterns - Replicate Backend Approach

Based on the liyaqa-backend architecture, here's how to structure the frontend application to maintain consistency and leverage the same proven patterns.

## 1. Feature-Based Organization (Critical!)

The backend uses feature-based organization - replicate this exactly in the frontend.

### Directory Structure

```typescript
src/
├── features/                    # Each feature is self-contained
│   ├── employees/               # Internal employee management
│   │   ├── api/
│   │   │   └── employeeApi.ts   # API calls: create, read, update, delete
│   │   ├── components/
│   │   │   ├── EmployeeList.tsx
│   │   │   ├── EmployeeForm.tsx
│   │   ├── hooks/
│   │   │   ├── useEmployees.ts   # Custom hook for employee state
│   │   │   ├── useEmployeeForm.ts
│   │   ├── store/
│   │   │   └── employeeSlice.ts  # Zustand/Redux slice
│   │   ├── types/
│   │   │   └── index.ts          # Employee, EmployeeResponse, etc.
│   │   ├── utils/
│   │   │   └── employeeMapper.ts # Map API response to domain models
│   │   └── index.ts              # Public exports from this feature
│   │
│   ├── tenants/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── types/
│   │   ├── utils/
│   │   └── index.ts
│   │
│   ├── facilities/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── types/
│   │   ├── utils/
│   │   └── index.ts
│   │
│   ├── bookings/               # Facility-facing feature
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── types/
│   │   ├── utils/
│   │   └── index.ts
│   │
│   ├── members/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── types/
│   │   ├── utils/
│   │   └── index.ts
│   │
│   ├── trainers/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── types/
│   │   ├── utils/
│   │   └── index.ts
│   │
│   └── auth/                   # Authentication (special case)
│       ├── api/
│       ├── components/
│       ├── hooks/
│       ├── store/
│       ├── types/
│       ├── utils/
│       └── index.ts
│
├── shared/                      # Cross-feature concerns
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── Navigation.tsx
│   │   └── PermissionGuard.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePermission.ts
│   │   └── useTenant.ts
│   ├── store/
│   │   ├── authSlice.ts
│   │   ├── tenantSlice.ts
│   │   └── store.ts            # Root store configuration
│   ├── types/
│   │   ├── api.ts              # Common API types
│   │   ├── auth.ts
│   │   └── permissions.ts      # Mirror backend Permission enum
│   ├── utils/
│   │   ├── apiClient.ts        # HTTP client with auth
│   │   ├── errorHandler.ts
│   │   └── validators.ts
│   └── constants/
│       ├── permissions.ts      # Permission enum matching backend
│       ├── apiEndpoints.ts
│       └── config.ts
│
└── pages/                       # Page components that compose features
    ├── EmployeeListPage.tsx
    ├── TenantManagementPage.tsx
    ├── BookingPage.tsx
    └── NotFoundPage.tsx
```

### Key Principle

Each feature folder is **completely self-contained**. You could extract it to a separate library without major changes.

## 2. Type Safety - Mirror Backend Domain Models

### Backend Types

```kotlin
data class EmployeeResponse(
    val id: UUID,
    val firstName: String,
    val lastName: String,
    val email: String,
    val status: EmployeeStatus,
    val groups: List<GroupResponse>,
    val permissions: Set<Permission>,
    val createdAt: Instant,
    val updatedAt: Instant
)
```

### Frontend Types

```typescript
// src/features/employees/types/index.ts

export enum EmployeeStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  TERMINATED = "TERMINATED"
}

export interface GroupResponse {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface EmployeeResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: EmployeeStatus;
  groups: GroupResponse[];
  permissions: Permission[];
  createdAt: string;  // ISO 8601
  updatedAt: string;
}

// For form submission (mirrors CreateEmployeeRequest from backend)
export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  jobTitle: string;
  phoneNumber?: string;
  groupIds?: string[];
}

// Domain model (internal to frontend, mirrors backend entity)
export interface Employee extends EmployeeResponse {
  // Add any frontend-specific properties here
  fullName: string;
}

// Mapper function (mirrors backend companion object pattern)
export const mapEmployeeResponse = (response: EmployeeResponse): Employee => ({
  ...response,
  fullName: `${response.firstName} ${response.lastName}`
});
```

### Permission Enum (Mirror Backend Exactly)

```typescript
// src/shared/types/permissions.ts

export enum Permission {
  // Employee Management
  EMPLOYEE_VIEW = "EMPLOYEE_VIEW",
  EMPLOYEE_CREATE = "EMPLOYEE_CREATE",
  EMPLOYEE_UPDATE = "EMPLOYEE_UPDATE",
  EMPLOYEE_DELETE = "EMPLOYEE_DELETE",

  // Tenant Management
  TENANT_VIEW = "TENANT_VIEW",
  TENANT_CREATE = "TENANT_CREATE",
  TENANT_UPDATE = "TENANT_UPDATE",
  TENANT_DELETE = "TENANT_DELETE",

  // Facility Management
  FACILITY_VIEW = "FACILITY_VIEW",
  FACILITY_CREATE = "FACILITY_CREATE",
  FACILITY_UPDATE = "FACILITY_UPDATE",
  FACILITY_DELETE = "FACILITY_DELETE",

  // ... mirror backend Permission enum exactly
}
```

## 3. API Layer Pattern

### Backend Pattern

```kotlin
@Service
@Transactional
class EmployeeService(
    private val employeeRepository: EmployeeRepository,
    private val auditService: AuditService
) {
    fun createEmployee(request: CreateEmployeeRequest, createdBy: Employee): EmployeeResponse {
        // Validation, business logic, persistence
        return EmployeeResponse.from(savedEmployee)
    }
}

@RestController
@RequestMapping("/api/v1/internal/employees")
class EmployeeController(private val employeeService: EmployeeService) {
    @PostMapping
    @RequirePermission(Permission.EMPLOYEE_CREATE)
    fun createEmployee(@Valid @RequestBody request: CreateEmployeeRequest): EmployeeResponse {
        return employeeService.createEmployee(request, currentEmployee)
    }
}
```

### Frontend Pattern

```typescript
// src/features/employees/api/employeeApi.ts

const API_BASE = "/api/v1/internal/employees";

export const employeeApi = {
  // List employees
  async listEmployees(params: {
    search?: string;
    department?: string;
    status?: string;
    page?: number;
    size?: number;
  }) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.append(key, String(value));
    });
    return apiClient.get<Page<EmployeeResponse>>(`${API_BASE}?${query}`);
  },

  // Get single employee
  async getEmployee(id: string) {
    return apiClient.get<EmployeeResponse>(`${API_BASE}/${id}`);
  },

  // Create employee
  async createEmployee(request: CreateEmployeeRequest) {
    return apiClient.post<EmployeeResponse>(API_BASE, request);
  },

  // Update employee
  async updateEmployee(id: string, request: UpdateEmployeeRequest) {
    return apiClient.patch<EmployeeResponse>(`${API_BASE}/${id}`, request);
  },

  // Delete employee
  async deleteEmployee(id: string) {
    return apiClient.delete(`${API_BASE}/${id}`);
  }
};
```

### API Client Wrapper

```typescript
// src/shared/utils/apiClient.ts

import axios, { AxiosError } from "axios";
import { useAuthStore } from "@/shared/store/authSlice";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
  headers: {
    "Content-Type": "application/json"
  }
});

// Add JWT token to requests
apiClient.interceptors.request.use((config) => {
  const authStore = useAuthStore.getState();
  const token = authStore.accessToken;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Handle errors consistently
apiClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    
    throw mapApiError(error);
  }
);

export default apiClient;
```

## 4. State Management - Feature Slices

### Backend Service Pattern

```kotlin
@Service
@Transactional
class EmployeeService(...) {
    fun createEmployee(request: CreateEmployeeRequest, createdBy: Employee): EmployeeResponse {
        // Validation
        if (employeeRepository.existsByEmail(request.email)) {
            throw EmployeeAlreadyExistsException(...)
        }
        
        // Business logic
        val employee = Employee(...)
        val savedEmployee = employeeRepository.save(employee)
        
        // Audit
        auditService.logEmployeeCreated(...)
        
        return EmployeeResponse.from(savedEmployee)
    }
}
```

### Frontend Zustand Pattern

```typescript
// src/features/employees/store/employeeSlice.ts

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { employeeApi } from "@/features/employees/api/employeeApi";
import { EmployeeResponse, CreateEmployeeRequest } from "@/features/employees/types";

interface EmployeeState {
  employees: EmployeeResponse[];
  currentEmployee: EmployeeResponse | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;

  // Actions
  fetchEmployees: (params?: any) => Promise<void>;
  createEmployee: (request: CreateEmployeeRequest) => Promise<EmployeeResponse>;
  updateEmployee: (id: string, request: any) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
}

export const useEmployeeStore = create<EmployeeState>()(
  immer((set) => ({
    employees: [],
    currentEmployee: null,
    loading: false,
    error: null,
    totalCount: 0,
    currentPage: 0,

    fetchEmployees: async (params = {}) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        const response = await employeeApi.listEmployees(params);
        set((state) => {
          state.employees = response.content;
          state.totalCount = response.totalElements;
          state.currentPage = response.number;
          state.loading = false;
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : "Unknown error";
          state.loading = false;
        });
        throw error;
      }
    },

    createEmployee: async (request) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        const newEmployee = await employeeApi.createEmployee(request);
        set((state) => {
          state.employees.push(newEmployee);
          state.totalCount += 1;
          state.loading = false;
        });
        return newEmployee;
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : "Unknown error";
          state.loading = false;
        });
        throw error;
      }
    },

    updateEmployee: async (id, request) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        const updated = await employeeApi.updateEmployee(id, request);
        set((state) => {
          const index = state.employees.findIndex((e) => e.id === id);
          if (index >= 0) {
            state.employees[index] = updated;
          }
          state.loading = false;
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : "Unknown error";
          state.loading = false;
        });
        throw error;
      }
    },

    deleteEmployee: async (id) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        await employeeApi.deleteEmployee(id);
        set((state) => {
          state.employees = state.employees.filter((e) => e.id !== id);
          state.totalCount -= 1;
          state.loading = false;
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : "Unknown error";
          state.loading = false;
        });
        throw error;
      }
    }
  }))
);
```

## 5. Custom Hooks - Business Logic

### Mirror Backend Service Methods

```typescript
// src/features/employees/hooks/useEmployees.ts

import { useEffect } from "react";
import { useEmployeeStore } from "@/features/employees/store/employeeSlice";
import { usePermission } from "@/shared/hooks/usePermission";
import { Permission } from "@/shared/types/permissions";

export const useEmployees = (params = {}) => {
  const store = useEmployeeStore();
  const canView = usePermission(Permission.EMPLOYEE_VIEW);

  useEffect(() => {
    if (canView) {
      store.fetchEmployees(params);
    }
  }, [canView, params, store]);

  return {
    employees: store.employees,
    loading: store.loading,
    error: store.error,
    totalCount: store.totalCount,
    refresh: () => store.fetchEmployees(params)
  };
};

export const useEmployeeForm = (employeeId?: string) => {
  const store = useEmployeeStore();
  const canCreate = usePermission(Permission.EMPLOYEE_CREATE);
  const canUpdate = usePermission(Permission.EMPLOYEE_UPDATE);
  const canDelete = usePermission(Permission.EMPLOYEE_DELETE);

  const handleCreate = async (data: CreateEmployeeRequest) => {
    if (!canCreate) {
      throw new Error("You do not have permission to create employees");
    }
    return store.createEmployee(data);
  };

  const handleUpdate = async (data: any) => {
    if (!canUpdate) {
      throw new Error("You do not have permission to update employees");
    }
    return store.updateEmployee(employeeId!, data);
  };

  const handleDelete = async () => {
    if (!canDelete) {
      throw new Error("You do not have permission to delete employees");
    }
    return store.deleteEmployee(employeeId!);
  };

  return {
    create: handleCreate,
    update: handleUpdate,
    delete: handleDelete,
    canCreate,
    canUpdate,
    canDelete,
    loading: store.loading,
    error: store.error
  };
};
```

## 6. Permission System - Guard Components

### Backend Permission Checks

```kotlin
@PostMapping
@RequirePermission(Permission.EMPLOYEE_CREATE)
fun createEmployee(...): EmployeeResponse { ... }
```

### Frontend Permission Guards

```typescript
// src/shared/hooks/usePermission.ts

import { useAuthStore } from "@/shared/store/authSlice";
import { Permission } from "@/shared/types/permissions";

export const usePermission = (permission: Permission): boolean => {
  const authStore = useAuthStore();
  const user = authStore.user;

  if (!user) return false;

  return user.permissions.includes(permission);
};

export const usePermissions = (permissions: Permission[]): boolean => {
  const authStore = useAuthStore();
  const user = authStore.user;

  if (!user) return false;

  return permissions.every((p) => user.permissions.includes(p));
};

// src/shared/components/PermissionGuard.tsx

interface PermissionGuardProps {
  permission: Permission | Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback
}) => {
  const permissions = Array.isArray(permission) ? permission : [permission];
  const authorized = permissions.every((p) => usePermission(p));

  if (!authorized) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};
```

### Usage in Components

```typescript
// src/features/employees/components/EmployeeList.tsx

import { PermissionGuard } from "@/shared/components/PermissionGuard";
import { Permission } from "@/shared/types/permissions";
import { useEmployees } from "@/features/employees/hooks/useEmployees";

export const EmployeeList: React.FC = () => {
  const { employees, loading, error } = useEmployees();

  return (
    <div>
      <h1>Employee Management</h1>
      
      <PermissionGuard
        permission={Permission.EMPLOYEE_CREATE}
        fallback={<p>You do not have permission to create employees</p>}
      >
        <CreateEmployeeButton />
      </PermissionGuard>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      
      <table>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>{employee.firstName} {employee.lastName}</td>
              <td>{employee.email}</td>
              <PermissionGuard permission={Permission.EMPLOYEE_UPDATE}>
                <EditButton id={employee.id} />
              </PermissionGuard>
              <PermissionGuard permission={Permission.EMPLOYEE_DELETE}>
                <DeleteButton id={employee.id} />
              </PermissionGuard>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

## 7. Multi-Tenancy Support

### Backend Approach

```kotlin
// TenantContext manages tenant isolation
object TenantContext {
    private val currentTenant = ThreadLocal<String>()
    fun setTenantId(tenantId: String) = currentTenant.set(tenantId)
}

// All entities have tenantId
abstract class BaseEntity {
    @Column(name = "tenant_id", nullable = false)
    open var tenantId: String = ""
}
```

### Frontend Approach

```typescript
// src/shared/store/tenantSlice.ts

import { create } from "zustand";

interface TenantState {
  currentTenantId: string | null;
  currentFacilityId: string | null;
  
  setTenant: (tenantId: string) => void;
  setFacility: (facilityId: string) => void;
  clear: () => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  currentTenantId: null,
  currentFacilityId: null,
  
  setTenant: (tenantId) => set({ currentTenantId: tenantId }),
  setFacility: (facilityId) => set({ currentFacilityId: facilityId }),
  clear: () => set({ currentTenantId: null, currentFacilityId: null })
}));

// src/shared/hooks/useTenant.ts

export const useTenant = () => {
  const { currentTenantId, currentFacilityId, setTenant, setFacility, clear } = useTenantStore();

  return {
    tenantId: currentTenantId,
    facilityId: currentFacilityId,
    setTenant,
    setFacility,
    clear,
    isSet: currentTenantId !== null
  };
};
```

## 8. Error Handling - Mirror Backend Exceptions

### Backend Exceptions

```kotlin
class EmployeeNotFoundException(message: String) : RuntimeException(message)
class UnauthorizedException(message: String) : RuntimeException(message)
class ValidationException(message: String) : RuntimeException(message)
```

### Frontend Error Handling

```typescript
// src/shared/utils/errorHandler.ts

export class ApiError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = "Resource not found") {
    super("NOT_FOUND", 404, message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = "Unauthorized") {
    super("UNAUTHORIZED", 401, message);
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string = "Validation failed",
    public errors?: Record<string, string>
  ) {
    super("VALIDATION_ERROR", 400, message);
  }
}

// Map backend errors to frontend error types
export const mapApiError = (error: AxiosError): Error => {
  const status = error.response?.status;
  const data = error.response?.data as any;

  switch (status) {
    case 404:
      return new NotFoundError(data?.message || "Resource not found");
    case 401:
      return new UnauthorizedError(data?.message || "Unauthorized");
    case 400:
      return new ValidationError(data?.message, data?.errors);
    default:
      return new Error(data?.message || "Unknown error");
  }
};
```

## 9. Form Validation - Match Backend

### Backend Validation (Jakarta Annotations)

```kotlin
data class CreateEmployeeRequest(
    @field:NotBlank
    val firstName: String,
    
    @field:NotBlank
    val lastName: String,
    
    @field:Email
    val email: String,
    
    @field:NotBlank
    val department: String
)
```

### Frontend Validation (Zod)

```typescript
// src/features/employees/types/index.ts

import { z } from "zod";

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  department: z.string().min(1, "Department is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  phoneNumber: z.string().optional()
});

export type CreateEmployeeRequest = z.infer<typeof createEmployeeSchema>;
```

## Summary: Key Patterns

1. **Feature-Based Organization** - Each feature self-contained
2. **Type Safety** - Mirror backend domain models exactly
3. **API Layer** - Dedicated API functions per feature
4. **State Management** - Zustand slices with proper error handling
5. **Custom Hooks** - Business logic in hooks, UI in components
6. **Permission Guards** - React components that respect backend permissions
7. **Multi-Tenancy** - Global tenant context store
8. **Error Handling** - Map backend exceptions to frontend errors
9. **Validation** - Validate at API boundary using Zod/React Hook Form

This approach ensures your frontend architecture mirrors the backend's proven patterns while being idiomatic to React/TypeScript.
